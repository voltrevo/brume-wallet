import { ping } from "@/libs/ping"
import { Sockets } from "@/libs/sockets/sockets"
import { WebSocketDuplex } from "@/libs/streams/websocket"
import { MicrodescQuery } from "@/mods/universal/entities/microdescs/data"
import { Opaque, Writable } from "@hazae41/binary"
import { Box } from "@hazae41/box"
import { Disposer } from "@hazae41/disposer"
import { TorClientDuplex, createSnowflakeStream } from "@hazae41/echalote"
import { QueryStorage } from "@hazae41/glacier"
import { Mutex } from "@hazae41/mutex"
import { None, Option } from "@hazae41/option"
import { Pool } from "@hazae41/piscine"
import { Result } from "@hazae41/result"

export function createNativeWebSocketPool(size: number) {
  const pool = new Pool<Disposer<WebSocket>>(async (params) => {
    const { index, signal } = params

    while (!signal.aborted) {
      try {
        return await (async () => {
          let start = Date.now()

          using stack = new Box(new DisposableStack())

          const socket = new WebSocket("wss://snowflake.torproject.net/")

          socket.binaryType = "arraybuffer"

          start = Date.now()
          await Sockets.waitOrThrow(socket)
          console.debug(`Opened native WebSocket in ${Date.now() - start}ms`)
          ping.value = Date.now() - start

          const entry = new Box(new Disposer(socket, () => socket.close()))
          stack.getOrThrow().use(entry)

          const onCloseOrError = (reason?: unknown) => pool.restart(index)

          socket.addEventListener("close", onCloseOrError, { passive: true })
          stack.getOrThrow().defer(() => socket.removeEventListener("close", onCloseOrError))

          socket.addEventListener("error", onCloseOrError, { passive: true })
          stack.getOrThrow().defer(() => socket.removeEventListener("error", onCloseOrError))

          const onOffline = () => {
            socket.close()
            pool.restart(index)
          }

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

    throw new Error("Aborted", { cause: signal.reason })
  })

  for (let i = 0; i < size; i++)
    pool.start(i)

  return new Disposer(pool, () => { })
}

export async function createTorOrThrow(raw: { outer: ReadableWritablePair<Opaque, Writable> }, signal: AbortSignal): Promise<TorClientDuplex> {
  const tcp = createSnowflakeStream(raw)
  const tor = new TorClientDuplex()

  tcp.outer.readable.pipeTo(tor.inner.writable).catch(() => { })
  tor.inner.readable.pipeTo(tcp.outer.writable).catch(() => { })

  await tor.waitOrThrow(signal)

  return tor
}

export function createTorPool(sockets: Mutex<Pool<Disposer<WebSocket>>>, storage: QueryStorage, size: number) {
  let update = Date.now()

  const pool = new Pool<TorClientDuplex>(async (params) => {
    const { index, signal } = params

    while (!signal.aborted) {
      const start = Date.now()

      const result = await Result.runAndWrap(async () => {
        let start = Date.now()

        using stack = new Box(new DisposableStack())

        const socket = await sockets.inner.getCryptoRandomOrThrow(signal)
        const stream = new WebSocketDuplex(socket.get(), { shouldCloseOnError: true, shouldCloseOnClose: true })

        start = Date.now()
        const tor = new Box(await createTorOrThrow(stream, AbortSignal.any([AbortSignal.timeout(ping.value * 2), signal])))
        stack.getOrThrow().use(tor)
        console.debug(`Created Tor in ${Date.now() - start}ms`)

        const microdescsQuery = MicrodescQuery.All.create(tor.getOrThrow(), storage)
        const microdescsStale = await microdescsQuery.state.then(r => r.current?.ok().getOrNull())
        const microdescsFresh = microdescsQuery.fetch().then(r => Option.wrap(r.getAny().current).getOrThrow().getOrThrow())

        if (microdescsStale == null)
          await microdescsFresh

        const onCloseOrError = (reason?: unknown) => {
          pool.restart(index)
          return new None()
        }

        stack.getOrThrow().defer(tor.getOrThrow().events.on("close", onCloseOrError, { passive: true }))
        stack.getOrThrow().defer(tor.getOrThrow().events.on("error", onCloseOrError, { passive: true }))

        addEventListener("offline", onCloseOrError, { passive: true })
        stack.getOrThrow().defer(() => removeEventListener("offline", onCloseOrError))

        const unstack = stack.unwrapOrThrow()

        return new Disposer(tor, () => unstack.dispose())
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

  sockets.inner.events.on("started", onStarted, { passive: true })
  stack.defer(() => sockets.inner.events.off("started", onStarted))

  for (let i = 0; i < size; i++)
    pool.start(i)

  return new Disposer(pool, () => stack.dispose())
}