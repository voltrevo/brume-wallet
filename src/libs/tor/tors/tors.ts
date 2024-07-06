import { Sockets } from "@/libs/sockets/sockets"
import { WebSocketDuplex } from "@/libs/streams/websocket"
import { Opaque, Writable } from "@hazae41/binary"
import { Box } from "@hazae41/box"
import { Disposer } from "@hazae41/disposer"
import { Consensus, TorClientDuplex, createSnowflakeStream } from "@hazae41/echalote"
import { None } from "@hazae41/option"
import { Pool, PoolCreatorParams, PoolParams } from "@hazae41/piscine"

export function createNativeWebSocketPool(params: PoolParams) {
  const pool = new Pool<Disposer<WebSocket>>(async (subparams) => {
    async function f() {
      const { index, pool, signal } = subparams

      console.log("Creating native WebSocket", index, pool.capacity)

      while (!signal.aborted) {
        try {
          let restarted = false
          let start = Date.now()

          const socket = new WebSocket("wss://snowflake.torproject.net/")

          socket.binaryType = "arraybuffer"

          await Sockets.waitOrThrow(socket, AbortSignal.timeout(2000))

          console.log(`Created native WebSocket in ${Date.now() - start}ms`, index, socket)

          using preProxy = new Box(new Disposer(socket, () => {
            console.log("closing")
            socket.close()
          }))

          const onCloseOrError = (reason?: unknown) => {
            if (!restarted) {
              pool.restart(index)
              restarted = true
            }
          }

          console.log("ee")

          preProxy.inner.inner.addEventListener("close", onCloseOrError, { passive: true })
          using preOnCloseDisposer = new Box(new Disposer({}, () => preProxy.inner.inner.removeEventListener("close", onCloseOrError)))

          console.log("aa")

          preProxy.inner.inner.addEventListener("error", onCloseOrError, { passive: true })
          using preOnErrorDisposer = new Box(new Disposer({}, () => preProxy.inner.inner.removeEventListener("error", onCloseOrError)))

          const onOffline = () => {
            /**
             * Close socket
             */
            preProxy.inner.get().close()

            /**
             * Restart pool
             */
            if (!restarted) {
              pool.restart(index)
              restarted = true
            }
          }

          addEventListener("offline", onOffline, { passive: true })
          const onOfflineClean = () => removeEventListener("offline", onOffline)
          using preOnOfflineDisposer = new Box(new Disposer({}, onOfflineClean))

          console.log("bb")

          const proxy = preProxy.moveOrThrow()
          const onCloseDisposer = preOnCloseDisposer.unwrapOrThrow()
          const onErrorDisposer = preOnErrorDisposer.unwrapOrThrow()
          const onOfflineDisposer = preOnOfflineDisposer.unwrapOrThrow()

          const onEntryClean = () => {
            using _0 = proxy
            using _1 = onCloseDisposer
            using _2 = onErrorDisposer
            using _3 = onOfflineDisposer
          }

          console.log("cc")

          return new Disposer(proxy, onEntryClean)
        } catch (e: unknown) {
          console.warn(`Could not create native socket`, index, { e })
          await new Promise(ok => setTimeout(ok, 1000))
          continue
        }
      }

      throw new Error(`Aborted`, { cause: signal.reason })
    }

    const result = await f()
    console.log("result", result)
    return result
  }, params)

  addEventListener("online", async () => {
    console.log("online")

    for (let i = 0; i < pool.capacity; i++) {
      const child = pool.tryGetSync(i)

      if (child.isErr())
        continue

      if (child.inner.isErr())
        pool.restart(i)

      continue
    }
  })

  return pool
}

export async function createTorOrThrow(raw: { outer: ReadableWritablePair<Opaque, Writable> }, signal: AbortSignal): Promise<TorClientDuplex> {
  const tcp = createSnowflakeStream(raw)
  const tor = new TorClientDuplex()

  tcp.outer.readable.pipeTo(tor.inner.writable).catch(() => { })
  tor.inner.readable.pipeTo(tcp.outer.writable).catch(() => { })

  await tor.waitOrThrow(signal)

  return tor
}

export function createTorAndConsensusEntry(preTorAndConsensus: Box<Disposer<readonly [TorClientDuplex, Consensus]>>, params: PoolCreatorParams<Disposer<readonly [TorClientDuplex, Consensus]>>) {
  const { pool, index } = params

  const rawTorAndConsensus = preTorAndConsensus.getOrThrow()

  using _ = preTorAndConsensus

  const onCloseOrError = async (reason?: unknown) => {
    pool.restart(index)
    return new None()
  }

  using preOnCloseDisposer = new Box(new Disposer({}, rawTorAndConsensus.inner[0].events.on("close", onCloseOrError, { passive: true })))
  using preOnErrorDisposer = new Box(new Disposer({}, rawTorAndConsensus.inner[0].events.on("error", onCloseOrError, { passive: true })))

  addEventListener("offline", onCloseOrError, { passive: true })
  const onOfflineClean = () => removeEventListener("offline", onCloseOrError)
  using preOnOfflineDisposer = new Box(new Disposer({}, onOfflineClean))

  /**
   * Move all resources
   */
  const torAndConsensus = preTorAndConsensus.moveOrThrow()
  const onCloseDisposer = preOnCloseDisposer.moveOrThrow()
  const onErrorDisposer = preOnErrorDisposer.moveOrThrow()
  const onOfflineDisposer = preOnOfflineDisposer.moveOrThrow()

  const onEntryClean = () => {
    using _0 = torAndConsensus
    using _1 = onCloseDisposer
    using _2 = onErrorDisposer
    using _3 = onOfflineDisposer
  }

  return new Disposer(torAndConsensus, onEntryClean)
}

export function createTorPool(sockets: Pool<Disposer<WebSocket>>, params: PoolParams) {
  const pool = new Pool<Disposer<readonly [TorClientDuplex, Consensus]>>(async (subparams) => {
    const { index, signal } = subparams

    while (!signal.aborted) {
      try {
        let start = Date.now()

        using preSocket = await sockets.getOrThrow(index % sockets.capacity, signal).then(r => r.unwrap().inner)
        console.log(preSocket.get())
        const stream = new WebSocketDuplex(preSocket.getOrThrow().get(), { shouldCloseOnError: true, shouldCloseOnClose: true })

        start = Date.now()
        using preTor = new Box(await createTorOrThrow(stream, AbortSignal.timeout(2000)))
        console.log(`Created Tor in ${Date.now() - start}ms`)

        start = Date.now()
        using tmpCircuit = await preTor.getOrThrow().createOrThrow(AbortSignal.timeout(2000))
        console.log(`Created consensus circuit in ${Date.now() - start}ms`)

        start = Date.now()
        const consensus = await Consensus.fetchOrThrow(tmpCircuit, AbortSignal.timeout(20_000))
        console.log(`Fetched consensus in ${Date.now() - start}ms`)

        /**
         * Move Tor into a new struct with [TorClientDuplex, Consensus]
         */
        const socket = preSocket.moveOrThrow()
        const tor = preTor.unwrapOrThrow()

        const onTorAndConsensusClean = () => {
          using _0 = socket
          using _1 = tor
        }

        using preTorAndConsensus = new Box(new Disposer([tor, consensus] as const, onTorAndConsensusClean))

        /**
         * NOOP
         */

        return createTorAndConsensusEntry(preTorAndConsensus.moveOrThrow(), subparams)
      } catch (e: unknown) {
        console.log(`Tor creation failed`, { e })
        await new Promise(ok => setTimeout(ok, 1000))
        continue
      }
    }

    throw new Error(`Aborted`, { cause: signal.reason })
  }, params)

  sockets.events.on("started", async i => {
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