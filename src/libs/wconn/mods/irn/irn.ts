import { Results } from "@/libs/results/results";
import { SafeJson } from "@/libs/wconn/mods/json/json";
import { WcBrume, WebSocketConnection } from "@/mods/background/service_worker/entities/brumes/data";
import { Box } from "@hazae41/box";
import { Disposer } from "@hazae41/disposer";
import { RpcInternalError, RpcInvalidRequestError, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { None } from "@hazae41/option";
import { Pool, PoolEntry } from "@hazae41/piscine";
import { CloseEvents, ErrorEvents, SuperEventTarget } from "@hazae41/plume";
import { Err, Ok, Result } from "@hazae41/result";
import { SafeRpc } from "../rpc/rpc";

export interface IrnSubscriptionPayload {
  readonly id: string
  readonly data: {
    readonly topic: string
    readonly message: string
    readonly publishedAt: number
    readonly tag: number
  }
}

export interface IrnPublishPayload {
  readonly topic: string
  readonly message: string
  readonly prompt: boolean
  readonly tag: number
  readonly ttl: number
}

export class IrnBrume {

  readonly topics = new Set<string>()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    request: (request: RpcRequestPreinit<unknown>) => Result<unknown, Error>
  }>()

  readonly pool: Pool<IrnSockets>
  readonly circuits: Mutex<Pool<Pool<WebSocketConnection>>>

  #closed?: { reason: unknown }

  constructor(
    readonly brume: WcBrume
  ) {
    this.circuits = new Mutex(brume.sockets)
    this.pool = this.#pool()
  }

  get closed() {
    return this.#closed
  }

  #pool() {
    let update = Date.now()

    const pool = new Pool<IrnSockets>(async ({ index, pool }) => {
      while (true) {
        const start = Date.now()

        const result = await Result.unthrow<Result<Disposer<Box<IrnSockets>>, Error>>(async t => {
          if (this.#closed)
            return new Err(new Error("Closed", { cause: this.#closed.reason }))

          const circuit = await Pool.tryTakeCryptoRandom(this.circuits).then(r => r.throw(t).throw(t).inner.inner)

          const irn = new IrnSockets(new Mutex(circuit))

          for (const topic of this.topics)
            await irn.trySubscribe(topic).then(r => r.throw(t))

          const onRequest = async (request: RpcRequestPreinit<unknown>) => {
            return await this.events.emit("request", [request])
          }

          const onCloseOrError = async () => {
            pool.restart(index)
            return new None()
          }

          irn.events.on("request", onRequest, { passive: true })
          irn.events.on("close", onCloseOrError, { passive: true })
          irn.events.on("error", onCloseOrError, { passive: true })

          const onEntryClean = () => {
            irn.events.off("request", onRequest)
            irn.events.off("close", onCloseOrError)
            irn.events.off("error", onCloseOrError)
          }

          return new Ok(new Disposer(new Box(irn), onEntryClean))
        }).then(Results.log)

        if (result.isOk())
          return result

        if (start < update)
          continue

        return result
      }
    }, { capacity: 1 })

    this.circuits.inner.events.on("started", async () => {
      update = Date.now()

      for (let i = 0; i < pool.capacity; i++) {
        const child = pool.tryGetSync(i)

        if (child.isErr())
          continue

        if (child.inner.isErr())
          pool.restart(i)

        continue
      }

      return new None()
    }, { passive: true })

    return pool
  }

  async trySubscribe(topic: string): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const client = await this.pool.tryGet(0).then(r => r.throw(t).throw(t).inner.inner)
      await client.trySubscribe(topic).then(r => r.throw(t))
      this.topics.add(topic)
      return Ok.void()
    })
  }

  async tryPublish(payload: IrnPublishPayload): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const client = await this.pool.tryGet(0).then(r => r.throw(t).throw(t).inner.inner)
      await client.tryPublish(payload).then(r => r.throw(t))
      return Ok.void()
    })
  }

  async tryClose(reason: unknown): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      this.#closed = { reason }

      await this.events.emit("close", [reason])

      const irn = await this.pool.tryGet(0).then(r => r.flatten().ok().mapSync(x => x.inner.inner))

      if (irn.isNone())
        return Ok.void()
      await irn.inner.tryClose(reason).then(r => r.throw(t))
      return Ok.void()
    })
  }

}

export class IrnSockets {

  readonly topics = new Set<string>()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    request: (request: RpcRequestPreinit<unknown>) => Result<unknown, Error>
  }>()

  readonly pool: Mutex<Pool<IrnClient>>

  #closed?: { reason: unknown }

  constructor(
    readonly sockets: Mutex<Pool<WebSocketConnection>>
  ) {
    this.pool = new Mutex(this.#pool())

    this.pool.inner.events.on("created", this.#onCreated.bind(this))
  }

  get closed() {
    return this.#closed
  }

  async #onCreated(entry: PoolEntry<IrnClient>) {
    if (entry.isErr())
      return await this.events.emit("error", [entry.inner])
    return new None()
  }

  #pool() {
    let update = Date.now()

    const pool = new Pool<IrnClient>(async ({ index, pool }) => {
      while (true) {
        const start = Date.now()

        const result = await Result.unthrow<Result<Disposer<Box<IrnClient>>, Error>>(async t => {
          if (this.#closed)
            return new Err(new Error("Closed", { cause: this.#closed.reason }))

          using preconn = await Pool.tryTakeCryptoRandom(this.sockets).then(r => r.throw(t).throw(t).inner)
          using preirn = new Box(new IrnClient(preconn.unwrapOrThrow().socket))

          for (const topic of this.topics)
            await preirn.inner.trySubscribe(topic).then(r => r.throw(t))

          const onRequest = async (request: RpcRequestPreinit<unknown>) => {
            return await this.events.emit("request", [request])
          }

          const onCloseOrError = async () => {
            pool.restart(index)
            return new None()
          }

          preirn.inner.events.on("request", onRequest, { passive: true })
          preirn.inner.events.on("close", onCloseOrError, { passive: true })
          preirn.inner.events.on("error", onCloseOrError, { passive: true })

          const irn = preirn.moveOrThrow()

          const onEntryClean = () => {
            using _ = irn

            irn.inner.events.off("request", onRequest)
            irn.inner.events.off("close", onCloseOrError)
            irn.inner.events.off("error", onCloseOrError)
          }

          return new Ok(new Disposer(irn, onEntryClean))
        }).then(Results.log)

        if (result.isOk())
          return result

        if (start < update)
          continue

        return result
      }
    }, { capacity: 1 })

    this.sockets.inner.events.on("started", async () => {
      update = Date.now()

      for (let i = 0; i < pool.capacity; i++) {
        const child = pool.tryGetSync(i)

        if (child.isErr())
          continue

        if (child.inner.isErr())
          pool.restart(i)

        continue
      }

      return new None()
    }, { passive: true })

    return pool
  }

  async trySubscribe(topic: string): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const client = await this.pool.inner.tryGet(0).then(r => r.throw(t).throw(t).inner.inner)
      await client.trySubscribe(topic).then(r => r.throw(t))
      this.topics.add(topic)
      return Ok.void()
    })
  }

  async tryPublish(payload: IrnPublishPayload): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const client = await this.pool.inner.tryGet(0).then(r => r.throw(t).throw(t).inner.inner)
      await client.tryPublish(payload).then(r => r.throw(t))
      return Ok.void()
    })
  }

  async tryClose(reason: unknown): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      this.#closed = { reason }

      await this.events.emit("close", [reason])

      const irn = await this.pool.inner.tryGet(0).then(r => r.flatten().ok().mapSync(x => x.inner.inner))

      if (irn.isNone())
        return Ok.void()
      await irn.inner.tryClose(reason).then(r => r.throw(t))
      return Ok.void()
    })
  }

}

export class IrnClient {

  readonly topicBySubscription = new Map<string, string>()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    request: (request: RpcRequestPreinit<unknown>) => Result<unknown, Error>
  }>()

  #closed?: { reason: unknown }

  constructor(
    readonly socket: WebSocket
  ) {
    socket.addEventListener("message", this.#onMessage.bind(this), { passive: true })
    socket.addEventListener("close", this.#onClose.bind(this), { passive: true })
    socket.addEventListener("error", this.#onError.bind(this), { passive: true })
  }

  [Symbol.dispose]() {
    this.tryClose(undefined).catch(console.error)
  }

  get closed() {
    return this.#closed
  }

  async #onClose(event: CloseEvent) {
    await this.events.emit("close", [event.reason])
  }

  async #onError(event: Event) {
    await this.events.emit("error", [undefined])
  }

  async #onMessage(event: MessageEvent<unknown>) {
    if (typeof event.data !== "string")
      return
    const json = JSON.parse(event.data) as RpcRequestInit<unknown> | RpcResponseInit<unknown>

    if ("method" in json)
      return await this.#onRequest(json)
    return
  }

  async #onRequest(request: RpcRequestInit<unknown>) {
    // console.log("irn", "->", request)
    const result = await this.#tryRouteRequest(request)
    const response = RpcResponse.rewrap(request.id, result)
    // console.log("irn", "<-", response)
    this.socket.send(SafeJson.stringify(response))
  }

  async #tryRouteRequest(request: RpcRequestPreinit<unknown>) {
    try {
      const returned = await this.events.emit("request", [request])

      if (returned.isSome())
        return returned.inner

      return new Err(new RpcInvalidRequestError())
    } catch (e: unknown) {
      return new Err(new RpcInternalError())
    }
  }

  async trySubscribe(topic: string): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const subscription = await SafeRpc.tryRequest<string>(this.socket, {
        method: "irn_subscribe",
        params: { topic }
      }, AbortSignal.timeout(5000)).then(r => r.throw(t).throw(t))

      this.topicBySubscription.set(subscription, topic)

      return new Ok(subscription)
    })
  }

  async tryPublish(payload: IrnPublishPayload): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const result = await SafeRpc.tryRequest<boolean>(this.socket, {
        method: "irn_publish",
        params: payload
      }, AbortSignal.timeout(5000)).then(r => r.throw(t).throw(t))

      return Result.assert(result)
    })
  }

  async tryClose(reason: unknown): Promise<Result<void, Error>> {
    this.#closed = { reason }
    await this.events.emit("close", [reason])
    this.socket.close()
    return Ok.void()
  }

}