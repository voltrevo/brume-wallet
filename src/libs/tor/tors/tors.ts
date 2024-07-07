import { DisposableStack } from "@/libs/disposable/stack"
import { AbortSignals } from "@/libs/signals/signals"
import { Sockets } from "@/libs/sockets/sockets"
import { WebSocketDuplex } from "@/libs/streams/websocket"
import { Opaque, Writable } from "@hazae41/binary"
import { Box } from "@hazae41/box"
import { Disposer } from "@hazae41/disposer"
import { Consensus, TorClientDuplex, createSnowflakeStream } from "@hazae41/echalote"
import { Mutex } from "@hazae41/mutex"
import { None, Option, Some } from "@hazae41/option"
import { Pool, PoolParams } from "@hazae41/piscine"
import { Result } from "@hazae41/result"

export function createNativeWebSocketPool(params: PoolParams) {
  const pool = new Pool<Disposer<WebSocket>>(async (subparams) => {
    const { index, pool, signal } = subparams

    if (!navigator.onLine)
      throw new Error()

    while (!signal.aborted) {
      try {
        return await (async () => {
          let start = Date.now()

          const socket = new WebSocket("wss://snowflake.torproject.net/")

          socket.binaryType = "arraybuffer"

          start = Date.now()
          await Sockets.waitOrThrow(socket, AbortSignals.timeout(2000, signal))
          console.log(`Opened native WebSocket in ${Date.now() - start}ms`)

          using stack = new Box(new DisposableStack())

          const entry = new Box(new Disposer(socket, () => socket.close()))
          stack.getOrThrow().use(entry)

          const onCloseOrError = (reason?: unknown) => pool.restart(index)

          socket.addEventListener("close", onCloseOrError, { passive: true })
          stack.getOrThrow().defer(() => socket.removeEventListener("close", onCloseOrError))

          socket.addEventListener("error", onCloseOrError, { passive: true })
          stack.getOrThrow().defer(() => socket.removeEventListener("error", onCloseOrError))

          const onOffline = () => socket.close()

          addEventListener("offline", onOffline, { passive: true })
          stack.getOrThrow().defer(() => removeEventListener("offline", onOffline))

          const unstack = stack.unwrapOrThrow()

          return new Disposer(entry, () => unstack.dispose())
        })()
      } catch (e: unknown) {
        console.warn(`Could not create native socket`, index, { e })
        await new Promise(ok => setTimeout(ok, 1000))
        continue
      }
    }

    throw new Error(`Aborted`, { cause: signal.reason })
  }, params)

  const stack = new DisposableStack()

  const onOnline = () => {
    for (let i = 0; i < pool.capacity; i++) {
      const child = pool.tryGetSync(i)

      if (child.isErr())
        continue

      if (child.inner.isErr())
        pool.restart(i)

      continue
    }
  }

  addEventListener("online", onOnline, { passive: true })
  stack.defer(() => removeEventListener("online", onOnline))

  return new Disposer(pool, () => stack.dispose())
}

export let consensus: Option<Consensus> = new None()

export async function createTorOrThrow(raw: { outer: ReadableWritablePair<Opaque, Writable> }, signal: AbortSignal): Promise<TorClientDuplex> {
  const tcp = createSnowflakeStream(raw)
  const tor = new TorClientDuplex()

  tcp.outer.readable.pipeTo(tor.inner.writable).catch(() => { })
  tor.inner.readable.pipeTo(tcp.outer.writable).catch(() => { })

  await tor.waitOrThrow(signal)

  return tor
}

export function createTorPool(sockets: Mutex<Pool<Disposer<WebSocket>>>, params: PoolParams) {
  let update = Date.now()

  const pool = new Pool<TorClientDuplex>(async (subparams) => {
    const { pool, index, signal } = subparams

    while (!signal.aborted) {
      const start = Date.now()

      const result = await Result.runAndWrap(async () => {
        let start = Date.now()

        using socket = await Pool.takeCryptoRandomOrThrow(sockets, signal).then(r => r.unwrap().get().moveOrThrow())
        const stream = new WebSocketDuplex(socket.getOrThrow().get(), { shouldCloseOnError: true, shouldCloseOnClose: true })

        start = Date.now()
        using tor = new Box(await createTorOrThrow(stream, AbortSignals.timeout(2000, signal)))
        console.log(`Created Tor in ${Date.now() - start}ms`)

        socket.unwrapOrThrow()

        if (consensus.isNone()) {
          start = Date.now()
          using circuit = await tor.getOrThrow().createOrThrow(AbortSignals.timeout(2000, signal))
          console.log(`Created consensus circuit in ${Date.now() - start}ms`)

          start = Date.now()
          consensus = new Some(await Consensus.fetchOrThrow(circuit, AbortSignals.timeout(20_000, signal)))
          console.log(`Fetched consensus in ${Date.now() - start}ms`)
        }

        using stack = new Box(new DisposableStack())

        const entry = tor.moveOrThrow()
        stack.getOrThrow().use(entry)

        const onCloseOrError = (reason?: unknown) => {
          pool.restart(index)
          return new None()
        }

        stack.getOrThrow().defer(entry.getOrThrow().events.on("close", onCloseOrError, { passive: true }))
        stack.getOrThrow().defer(entry.getOrThrow().events.on("error", onCloseOrError, { passive: true }))

        addEventListener("offline", onCloseOrError, { passive: true })
        stack.getOrThrow().defer(() => removeEventListener("offline", onCloseOrError))

        const unstack = stack.unwrapOrThrow()

        return new Disposer(entry, () => unstack.dispose())
      })

      if (result.isOk())
        return result.get()

      if (start < update)
        continue

      throw result.getErr()
    }

    throw new Error(`Aborted`, { cause: signal.reason })
  }, params)

  const stack = new DisposableStack()

  const onStarted = () => {
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
  }

  sockets.inner.events.on("started", onStarted, { passive: true })
  stack.defer(() => sockets.inner.events.off("started", onStarted))

  return new Disposer(pool, () => stack.dispose())
}