import { ping } from "@/libs/ping";
import { AutoPool } from "@/libs/pool";
import { WcBrume, WebSocketConnection } from "@/mods/background/service_worker/entities/brumes/data";
import { Box, Deferred, Stack } from "@hazae41/box";
import { Disposer } from "@hazae41/disposer";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { IrnClient, IrnClientLike, IrnPublishPayload } from "@hazae41/latrine";
import { PoolEntry } from "@hazae41/piscine";
import { CloseEvents, ErrorEvents, SuperEventTarget } from "@hazae41/plume";
import { Result } from "@hazae41/result";

export class IrnBrume implements IrnClientLike {

  readonly topics = new Set<string>()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    request: (request: RpcRequestPreinit<unknown>) => unknown
  }>()

  readonly pool: AutoPool<IrnSockets>
  readonly circuits: AutoPool<Disposer<AutoPool<WebSocketConnection>>>

  #closed?: { reason: unknown }

  constructor(
    readonly brume: WcBrume
  ) {
    this.circuits = brume.sockets
    this.pool = this.#pool().get()
  }

  get closed() {
    return this.#closed
  }

  #pool() {
    let update = Date.now()

    const pool = new AutoPool<IrnSockets>(async (params) => {
      const { index, signal } = params

      while (!signal.aborted) {
        const start = Date.now()

        const result = await Result.runAndWrap(async () => {
          using stack = new Box(new Stack())

          if (this.#closed)
            throw new Error("Closed", { cause: this.#closed.reason })

          const circuit = await this.circuits.takeCryptoRandomOrThrow(signal)
          const irn = new IrnSockets(circuit.get())

          const entry = new Box(irn)
          stack.getOrThrow().push(entry)

          for (const topic of this.topics) {
            const timeout = AbortSignal.timeout(ping.value * 10)
            const subsignal = AbortSignal.any([signal, timeout])
            await irn.subscribeOrThrow(topic, subsignal)
          }

          const onRequest = async (request: RpcRequestPreinit<unknown>) => {
            return await this.events.emit("request", request)
          }

          stack.getOrThrow().push(new Deferred(irn.events.on("request", onRequest, { passive: true })))

          const onCloseOrError = () => void pool.restart(index)

          stack.getOrThrow().push(new Deferred(irn.events.on("close", onCloseOrError, { passive: true })))
          stack.getOrThrow().push(new Deferred(irn.events.on("error", onCloseOrError, { passive: true })))

          const unstack = stack.unwrapOrThrow()

          return new Disposer(entry, () => unstack[Symbol.dispose]())
        })

        if (result.isOk())
          return result.get()

        if (start < update)
          continue

        throw result.getErr()
      }

      throw new Error("Aborted", { cause: signal.reason })
    }, 1)

    const onStarted = () => {
      update = Date.now()

      for (const entry of pool.errEntries)
        pool.restart(entry.index)

      return
    }

    const stack = new Stack()

    stack.push(new Deferred(this.circuits.events.on("started", onStarted, { passive: true })))

    return new Disposer(pool, () => stack[Symbol.dispose]())
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

export class IrnSockets implements IrnClientLike {

  readonly topics = new Set<string>()

  readonly events = new SuperEventTarget<CloseEvents & ErrorEvents & {
    request: (request: RpcRequestPreinit<unknown>) => unknown
  }>()

  readonly pool: AutoPool<IrnClient>

  #closed?: { reason: unknown }

  constructor(
    readonly sockets: AutoPool<WebSocketConnection>
  ) {
    this.pool = this.#pool().get()

    this.pool.events.on("created", this.#onCreated.bind(this))
  }

  [Symbol.dispose]() {
    // TODO
  }

  get closed() {
    return this.#closed
  }

  async #onCreated(entry: PoolEntry<IrnClient>) {
    if (entry.isOk())
      return
    return await this.events.emit("error", [entry.inner])
  }

  #pool() {
    let update = Date.now()

    const pool = new AutoPool<IrnClient>(async (params) => {
      const { index, signal } = params

      while (!signal.aborted) {
        const start = Date.now()

        const result = await Result.runAndDoubleWrap(async () => {
          using stack = new Box(new Stack())

          if (this.#closed)
            throw new Error("Closed", { cause: this.#closed.reason })

          const conn = await this.sockets.takeCryptoRandomOrThrow(signal)
          const irn = new IrnClient(conn.socket)

          const entry = new Box(irn)
          stack.getOrThrow().push(entry)

          for (const topic of this.topics) {
            const timeout = AbortSignal.timeout(ping.value * 10)
            const subsignal = AbortSignal.any([signal, timeout])
            await irn.subscribeOrThrow(topic, subsignal)
          }

          const onRequest = async (request: RpcRequestPreinit<unknown>) => {
            return await this.events.emit("request", request)
          }

          stack.getOrThrow().push(new Deferred(irn.events.on("request", onRequest, { passive: true })))

          const onCloseOrError = () => void pool.restart(index)

          stack.getOrThrow().push(new Deferred(irn.events.on("close", onCloseOrError, { passive: true })))
          stack.getOrThrow().push(new Deferred(irn.events.on("error", onCloseOrError, { passive: true })))

          const unstack = stack.unwrapOrThrow()

          return new Disposer(entry, () => unstack[Symbol.dispose]())
        })

        if (result.isOk())
          return result.get()

        if (start < update)
          continue

        throw result.getErr()
      }

      throw new Error("Aborted", { cause: signal.reason })
    }, 1)

    const onStarted = () => {
      update = Date.now()

      for (const entry of pool.errEntries)
        pool.restart(entry.index)

      return
    }

    const stack = new Stack()

    stack.push(new Deferred(this.sockets.events.on("started", onStarted, { passive: true })))

    return new Disposer(pool, () => stack[Symbol.dispose]())
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