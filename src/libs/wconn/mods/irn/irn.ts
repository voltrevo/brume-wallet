import { IrnClient, IrnLike, IrnPublishPayload } from "@/libs/latrine/mods/irn";
import { ping } from "@/libs/ping";
import { WcBrume, WebSocketConnection } from "@/mods/background/service_worker/entities/brumes/data";
import { Box } from "@hazae41/box";
import { Disposer } from "@hazae41/disposer";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { None } from "@hazae41/option";
import { Pool, PoolEntry } from "@hazae41/piscine";
import { CloseEvents, ErrorEvents, SuperEventTarget } from "@hazae41/plume";
import { Result } from "@hazae41/result";

export class IrnBrume implements IrnLike {

  readonly topics = new Set<string>()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    request: (request: RpcRequestPreinit<unknown>) => unknown
  }>()

  readonly pool: Pool<IrnSockets>
  readonly circuits: Mutex<Pool<Disposer<Pool<WebSocketConnection>>>>

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

    const pool = new Pool<IrnSockets>(async (params) => {
      const { index, signal } = params

      while (!signal.aborted) {
        const start = Date.now()

        const result = await Result.runAndWrap(async () => {
          using stack = new Box(new DisposableStack())

          if (this.#closed)
            throw new Error("Closed", { cause: this.#closed.reason })

          const circuit = await Pool.takeCryptoRandomOrThrow(this.circuits, signal)
          const irn = new IrnSockets(new Mutex(circuit.get()))

          const entry = new Box(irn)
          stack.getOrThrow().use(entry)

          for (const topic of this.topics) {
            const timeout = AbortSignal.timeout(ping.value * 6)
            const subsignal = AbortSignal.any([signal, timeout])
            await irn.subscribeOrThrow(topic, subsignal)
          }

          const onRequest = async (request: RpcRequestPreinit<unknown>) => {
            return await this.events.emit("request", request)
          }

          const onCloseOrError = async () => {
            pool.restart(index)
            return new None()
          }

          stack.getOrThrow().defer(irn.events.on("request", onRequest, { passive: true }))
          stack.getOrThrow().defer(irn.events.on("close", onCloseOrError, { passive: true }))
          stack.getOrThrow().defer(irn.events.on("error", onCloseOrError, { passive: true }))

          const unstack = stack.unwrapOrThrow()

          return new Disposer(entry, () => unstack.dispose())
        })

        if (result.isOk())
          return result.get()

        if (start < update)
          continue

        throw result.getErr()
      }

      throw new Error("Aborted", { cause: signal.reason })
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

  async subscribeOrThrow(topic: string, signal = new AbortController().signal): Promise<string> {
    const client = await this.pool.getOrThrow(0, signal)
    const subscription = await client.subscribeOrThrow(topic, signal)

    this.topics.add(topic)

    return subscription
  }

  async publishOrThrow(payload: IrnPublishPayload, signal = new AbortController().signal): Promise<void> {
    const client = await this.pool.getOrThrow(0, signal)
    await client.publishOrThrow(payload, signal)
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

export class IrnSockets implements IrnLike {

  readonly topics = new Set<string>()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    request: (request: RpcRequestPreinit<unknown>) => unknown
  }>()

  readonly pool: Mutex<Pool<IrnClient>>

  #closed?: { reason: unknown }

  constructor(
    readonly sockets: Mutex<Pool<WebSocketConnection>>
  ) {
    this.pool = new Mutex(this.#pool().get())

    this.pool.inner.events.on("created", this.#onCreated.bind(this))
  }

  [Symbol.dispose]() {
    // TODO
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

    const pool = new Pool<IrnClient>(async (params) => {
      const { index, signal } = params

      while (!signal.aborted) {
        const start = Date.now()

        const result = await Result.runAndDoubleWrap(async () => {
          using stack = new Box(new DisposableStack())

          if (this.#closed)
            throw new Error("Closed", { cause: this.#closed.reason })

          const conn = await Pool.takeCryptoRandomOrThrow(this.sockets, signal)
          const irn = new IrnClient(conn.socket)

          const entry = new Box(irn)
          stack.getOrThrow().use(entry)

          for (const topic of this.topics) {
            const timeout = AbortSignal.timeout(ping.value * 6)
            const subsignal = AbortSignal.any([signal, timeout])
            await irn.subscribeOrThrow(topic, subsignal)
          }

          const onRequest = async (request: RpcRequestPreinit<unknown>) => {
            return await this.events.emit("request", request)
          }

          const onCloseOrError = async () => {
            pool.restart(index)
            return new None()
          }

          stack.getOrThrow().defer(irn.events.on("request", onRequest, { passive: true }))
          stack.getOrThrow().defer(irn.events.on("close", onCloseOrError, { passive: true }))
          stack.getOrThrow().defer(irn.events.on("error", onCloseOrError, { passive: true }))

          const unstack = stack.unwrapOrThrow()

          return new Disposer(entry, () => unstack.dispose())
        })

        if (result.isOk())
          return result.get()

        if (start < update)
          continue

        throw result.getErr()
      }

      throw new Error("Aborted", { cause: signal.reason })
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

  async subscribeOrThrow(topic: string, signal = new AbortController().signal): Promise<string> {
    const client = await this.pool.inner.getOrThrow(0, signal)
    const subscription = await client.subscribeOrThrow(topic, signal)

    this.topics.add(topic)

    return subscription
  }

  async publishOrThrow(payload: IrnPublishPayload, signal = new AbortController().signal): Promise<void> {
    const client = await this.pool.inner.getOrThrow(0, signal)
    await client.publishOrThrow(payload, signal)
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