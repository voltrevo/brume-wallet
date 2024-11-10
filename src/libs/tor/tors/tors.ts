import { ping } from "@/libs/ping"
import { AutoPool } from "@/libs/pool"
import { Sockets } from "@/libs/sockets/sockets"
import { WebSocketDuplex } from "@/libs/streams/websocket"
import { MicrodescQuery } from "@/mods/universal/entities/microdescs/data"
import { Opaque, Writable } from "@hazae41/binary"
import { Box, Deferred, Stack } from "@hazae41/box"
import { Disposer } from "@hazae41/disposer"
import { TorClientDuplex, createSnowflakeStream } from "@hazae41/echalote"
import { QueryStorage } from "@hazae41/glacier"
import { Option } from "@hazae41/option"
import { Result } from "@hazae41/result"

export function createNativeWebSocketPool(size: number) {
  const pool = new AutoPool<Disposer<WebSocket>>(async (params) => {
    const { index, signal } = params

    while (!signal.aborted) {
      try {
        return await (async () => {
          let start = Date.now()

          using stack = new Box(new Stack())

          const socket = new WebSocket("wss://snowflake.torproject.net/")

          socket.binaryType = "arraybuffer"

          start = Date.now()
          await Sockets.waitOrThrow(socket)
          console.debug(`Opened native WebSocket in ${Date.now() - start}ms`)
          ping.value = Date.now() - start

          const entry = new Box(new Disposer(socket, () => socket.close()))
          stack.getOrThrow().push(entry)

          const onCloseOrError = () => void pool.restart(index)

          socket.addEventListener("close", onCloseOrError, { passive: true })
          stack.getOrThrow().push(new Deferred(() => socket.removeEventListener("close", onCloseOrError)))

          socket.addEventListener("error", onCloseOrError, { passive: true })
          stack.getOrThrow().push(new Deferred(() => socket.removeEventListener("error", onCloseOrError)))

          const onOffline = () => {
            socket.close()
            pool.restart(index)
          }

          addEventListener("offline", onOffline, { passive: true })
          stack.getOrThrow().push(new Deferred(() => removeEventListener("offline", onOffline)))

          const unstack = stack.unwrapOrThrow()

          return new Disposer(entry, () => unstack[Symbol.dispose]())
        })()
      } catch (e: unknown) {
        console.warn(`Could not create native socket`, index, { e })
        await new Promise(ok => setTimeout(ok, 1000))
        continue
      }
    }

    throw new Error("Aborted", { cause: signal.reason })
  }, size)

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

export function createTorPool(sockets: AutoPool<Disposer<WebSocket>>, storage: QueryStorage, size: number) {
  let update = Date.now()

  const pool = new AutoPool<TorClientDuplex>(async (params) => {
    const { index, signal } = params

    while (!signal.aborted) {
      const start = Date.now()

      const result = await Result.runAndWrap(async () => {
        let start = Date.now()

        using stack = new Box(new Stack())

        const socket = await sockets.getCryptoRandomOrThrow(signal)
        const stream = new WebSocketDuplex(socket.get(), { shouldCloseOnError: true, shouldCloseOnClose: true })

        start = Date.now()
        const tor = new Box(await createTorOrThrow(stream, AbortSignal.any([AbortSignal.timeout(ping.value * 5), signal])))
        stack.getOrThrow().push(tor)
        console.debug(`Created Tor in ${Date.now() - start}ms`)

        const microdescsQuery = MicrodescQuery.All.create(tor.getOrThrow(), storage)
        const microdescsStale = await microdescsQuery.state.then(r => r.current?.ok().getOrNull())
        const microdescsFresh = microdescsQuery.fetch().then(r => Option.wrap(r.getAny().current).getOrThrow().getOrThrow())

        if (microdescsStale == null)
          await microdescsFresh

        const onCloseOrError = () => void pool.restart(index)

        stack.getOrThrow().push(new Deferred(tor.getOrThrow().events.on("close", onCloseOrError, { passive: true })))
        stack.getOrThrow().push(new Deferred(tor.getOrThrow().events.on("error", onCloseOrError, { passive: true })))

        addEventListener("offline", onCloseOrError, { passive: true })
        stack.getOrThrow().push(new Deferred(() => removeEventListener("offline", onCloseOrError)))

        const unstack = stack.unwrapOrThrow()

        return new Disposer(tor, () => unstack[Symbol.dispose]())
      })

      if (result.isOk())
        return result.get()

      if (start < update)
        continue

      throw result.getErr()
    }

    throw new Error("Aborted", { cause: signal.reason })
  }, size)

  const onStarted = () => {
    update = Date.now()

    for (const entry of pool.errEntries)
      pool.restart(entry.index)

    return
  }

  const stack = new Stack()

  stack.push(new Deferred(sockets.events.on("started", onStarted, { passive: true })))

  return new Disposer(pool, () => stack[Symbol.dispose]())
}