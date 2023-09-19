import { RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@/libs/rpc";
import { SafeJson } from "@/libs/wconn/mods/json/json";
import { WcBrume, WebSocketConnection } from "@/mods/background/service_worker/entities/brumes/data";
import { Disposer } from "@hazae41/cleaner";
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

export class IrnBrumes {

  readonly topics = new Set<string>()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    request: (request: RpcRequestPreinit<unknown>) => Result<unknown, Error>
  }>()

  readonly pool: Mutex<Pool<Disposer<IrnSockets>, Error>>

  #closed?: { reason: unknown }

  constructor(
    readonly brumes: Mutex<Pool<Disposer<WcBrume>, Error>>
  ) {
    this.pool = new Mutex(this.#pool())
  }

  get closed() {
    return this.#closed
  }

  #pool() {
    return new Pool<Disposer<IrnSockets>, Error>(async ({ index, pool }) => {
      return await Result.unthrow(async t => {
        if (this.#closed)
          return new Err(new Error("Closed", { cause: this.#closed.reason }))

        const sockets = await Pool.takeCryptoRandom(this.brumes).then(r => r.throw(t).result.inner.inner.sockets)
        const irn = new IrnSockets(new Mutex(sockets))

        for (const topic of this.topics)
          await irn.trySubscribe(topic).then(r => r.throw(t))

        const onRequest = (request: RpcRequestPreinit<unknown>) => {
          return this.events.emit("request", [request])
        }

        const onCloseOrError = async () => {
          console.log("irn brume closed")
          await pool.restart(index)
          return new None()
        }

        irn.events.on("request", onRequest, { passive: true })
        irn.events.on("close", onCloseOrError, { passive: true })
        irn.events.on("error", onCloseOrError, { passive: true })

        const dispose = () => {
          irn.events.off("request", onRequest)
          irn.events.off("close", onCloseOrError)
          irn.events.off("error", onCloseOrError)
        }

        console.log("irn brume opened")
        return new Ok(new Disposer(irn, dispose))
      })
    }, { capacity: 1 })
  }

  async trySubscribe(topic: string): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const client = await this.pool.inner.tryGet(0).then(r => r.throw(t).inner)
      await client.trySubscribe(topic).then(r => r.throw(t))
      this.topics.add(topic)
      return Ok.void()
    })
  }

  async tryPublish(payload: IrnPublishPayload): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const client = await this.pool.inner.tryGet(0).then(r => r.throw(t).inner)
      await client.tryPublish(payload).then(r => r.throw(t))
      return Ok.void()
    })
  }

  async tryClose(reason: unknown): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      this.#closed = { reason }

      await this.events.emit("close", [reason])

      const irn = await this.pool.inner.tryGet(0).then(r => r.ok().mapSync(x => x.inner))

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

  readonly pool: Mutex<Pool<Disposer<IrnClient>, Error>>

  #closed?: { reason: unknown }

  constructor(
    readonly sockets: Mutex<Pool<Disposer<WebSocketConnection>, Error>>
  ) {
    this.pool = new Mutex(this.#pool())

    this.pool.inner.events.on("created", this.#onCreated.bind(this))
  }

  get closed() {
    return this.#closed
  }

  async #onCreated(entry: PoolEntry<Disposer<IrnClient>, Error>) {
    if (entry.result.isErr())
      return await this.events.emit("error", [entry.result.inner])
    return new None()
  }

  #pool() {
    return new Pool<Disposer<IrnClient>, Error>(async ({ index, pool }) => {
      return await Result.unthrow(async t => {
        if (this.#closed)
          return new Err(new Error("Closed", { cause: this.#closed.reason }))

        const socket = await Pool.takeCryptoRandom(this.sockets).then(r => r.throw(t).result.inner.inner.socket)
        const irn = new IrnClient(socket)

        for (const topic of this.topics)
          await irn.trySubscribe(topic).then(r => r.throw(t))

        const onRequest = (request: RpcRequestPreinit<unknown>) => {
          return this.events.emit("request", [request])
        }

        const onCloseOrError = async () => {
          console.log("irn socket closed")
          await pool.restart(index)
          return new None()
        }

        irn.events.on("request", onRequest, { passive: true })
        irn.events.on("close", onCloseOrError, { passive: true })
        irn.events.on("error", onCloseOrError, { passive: true })

        const dispose = () => {
          irn.events.off("request", onRequest)
          irn.events.off("close", onCloseOrError)
          irn.events.off("error", onCloseOrError)
        }

        console.log("irn socket opened")
        return new Ok(new Disposer(irn, dispose))
      })
    }, { capacity: 1 })
  }

  async trySubscribe(topic: string): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const client = await this.pool.inner.tryGet(0).then(r => r.throw(t).inner)
      await client.trySubscribe(topic).then(r => r.throw(t))
      this.topics.add(topic)
      return Ok.void()
    })
  }

  async tryPublish(payload: IrnPublishPayload): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      const client = await this.pool.inner.tryGet(0).then(r => r.throw(t).inner)
      await client.tryPublish(payload).then(r => r.throw(t))
      return Ok.void()
    })
  }

  async tryClose(reason: unknown): Promise<Result<void, Error>> {
    return Result.unthrow(async t => {
      this.#closed = { reason }

      await this.events.emit("close", [reason])

      const irn = await this.pool.inner.tryGet(0).then(r => r.ok().mapSync(x => x.inner))

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
    const result = await this.#tryRouteRequest(request)
    const response = RpcResponse.rewrap(request.id, result)
    this.socket.send(SafeJson.stringify(response))
  }

  async #tryRouteRequest(request: RpcRequestPreinit<unknown>) {
    const returned = await this.events.emit("request", [request])

    if (returned.isSome())
      return returned.inner

    return new Err(new Error(`Unhandled`))
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
    return Result.unthrow(async t => {
      this.#closed = { reason }
      await this.events.emit("close", [reason])
      this.socket.close()
      return Ok.void()
    })
  }

}