import { ping } from "@/libs/ping";
import { Results } from "@/libs/results/results";
import { SafeJson } from "@/libs/wconn/mods/json/json";
import { WcBrume, WebSocketConnection } from "@/mods/background/service_worker/entities/brumes/data";
import { Box } from "@hazae41/box";
import { Disposer } from "@hazae41/disposer";
import { RpcError, RpcInvalidRequestError, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { None } from "@hazae41/option";
import { Pool, PoolEntry } from "@hazae41/piscine";
import { CloseEvents, ErrorEvents, SuperEventTarget } from "@hazae41/plume";
import { Err, Result } from "@hazae41/result";
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
    this.pool = this.#pool().get()
  }

  get closed() {
    return this.#closed
  }

  #pool() {
    let update = Date.now()

    const pool = new Pool<IrnSockets>(async ({ index, pool }) => {
      while (true) {
        const start = Date.now()

        const result = await Result.runAndWrap(async () => {
          if (this.#closed)
            throw new Error("Closed", { cause: this.#closed.reason })

          const circuit = await Pool.takeCryptoRandomOrThrow(this.circuits)

          const irn = new IrnSockets(new Mutex(circuit))

          for (const topic of this.topics)
            await irn.subscribeOrThrow(topic)

          const onRequest = async (request: RpcRequestPreinit<unknown>) => {
            return await this.events.emit("request", request)
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

          return new Disposer(new Box(irn), onEntryClean)
        }).then(Results.log)

        if (result.isOk())
          return result.get()

        if (start < update)
          continue

        throw result.getErr()
      }
    })

    const stack = new DisposableStack()

    const onStarted = () => {
      update = Date.now()

      for (let i = 0; i < pool.length; i++) {
        const slot = Result.runAndWrapSync(() => pool.getRawSyncOrThrow(i))

        if (slot.isErr())
          continue

        if (slot.get().isErr())
          pool.restart(i)

        continue
      }

      return new None()
    }

    this.circuits.inner.events.on("started", onStarted, { passive: true })
    stack.defer(() => this.circuits.inner.events.off("started", onStarted))

    pool.start(0)

    return new Disposer(pool, () => stack.dispose())
  }

  async subscribeOrThrow(topic: string): Promise<void> {
    const client = await this.pool.getOrThrow(0)
    await client.subscribeOrThrow(topic)

    this.topics.add(topic)
  }

  async publishOrThrow(payload: IrnPublishPayload): Promise<void> {
    const client = await this.pool.getOrThrow(0)
    await client.publishOrThrow(payload)
  }

  async closeOrThrow(reason: unknown): Promise<void> {
    this.#closed = { reason }

    await this.events.emit("close", [reason])

    const irn = await Result.runAndWrap(() => this.pool.getOrThrow(0))

    if (irn.isErr())
      return

    await irn.get().closeOrThrow(reason)
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
    this.pool = new Mutex(this.#pool().get())

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

        const result = await Result.runAndDoubleWrap(async () => {
          if (this.#closed)
            throw new Error("Closed", { cause: this.#closed.reason })

          using preconn = new Box(await Pool.takeCryptoRandomOrThrow(this.sockets))
          using preirn = new Box(new IrnClient(preconn.unwrapOrThrow().socket))

          for (const topic of this.topics)
            await preirn.inner.subscribeOrThrow(topic)

          const onRequest = async (request: RpcRequestPreinit<unknown>) => {
            return await this.events.emit("request", request)
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

          return new Disposer(irn, onEntryClean)
        }).then(Results.log)

        if (result.isOk())
          return result.get()

        if (start < update)
          continue

        throw result.getErr()
      }
    })

    const stack = new DisposableStack()

    const onStarted = () => {
      update = Date.now()

      for (let i = 0; i < pool.length; i++) {
        const slot = Result.runAndWrapSync(() => pool.getRawSyncOrThrow(i))

        if (slot.isErr())
          continue

        if (slot.get().isErr())
          pool.restart(i)

        continue
      }

      return new None()
    }

    this.sockets.inner.events.on("started", onStarted, { passive: true })
    stack.defer(() => this.sockets.inner.events.off("started", onStarted))

    pool.start(0)

    return new Disposer(pool, () => stack.dispose())
  }

  async subscribeOrThrow(topic: string): Promise<void> {
    const client = await this.pool.inner.getOrThrow(0)
    await client.subscribeOrThrow(topic)

    this.topics.add(topic)
  }

  async publishOrThrow(payload: IrnPublishPayload): Promise<void> {
    const client = await this.pool.inner.getOrThrow(0)
    await client.publishOrThrow(payload)
  }

  async closeOrThrow(reason: unknown): Promise<void> {
    this.#closed = { reason }

    await this.events.emit("close", [reason])

    const irn = await Result.runAndWrap(() => this.pool.inner.getOrThrow(0))

    if (irn.isErr())
      return

    await irn.get().closeOrThrow(reason)
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
    this.closeOrThrow(undefined).catch(console.error)
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
      const returned = await this.events.emit("request", request)

      if (returned.isSome())
        return returned.inner

      return new Err(new RpcInvalidRequestError())
    } catch (e: unknown) {
      return new Err(RpcError.rewrap(e))
    }
  }

  async subscribeOrThrow(topic: string): Promise<string> {
    const signal = AbortSignal.timeout(ping.value * 6)

    const subscription = await SafeRpc.requestOrThrow<string>(this.socket, {
      method: "irn_subscribe",
      params: { topic }
    }, signal).then(r => r.unwrap())

    this.topicBySubscription.set(subscription, topic)

    return subscription
  }

  async publishOrThrow(payload: IrnPublishPayload): Promise<void> {
    const signal = AbortSignal.timeout(ping.value * 6)

    const result = await SafeRpc.requestOrThrow<boolean>(this.socket, {
      method: "irn_publish",
      params: payload
    }, signal).then(r => r.unwrap())

    if (!result)
      throw new Error("Failed to publish")

    return
  }

  async closeOrThrow(reason: unknown): Promise<void> {
    this.#closed = { reason }
    await this.events.emit("close", [reason])
    this.socket.close()
  }

}