import { WebSocketDuplex } from "@/libs/streams/websocket"
import { Opaque, Writable } from "@hazae41/binary"
import { Box } from "@hazae41/box"
import { Disposer } from "@hazae41/disposer"
import { Consensus, TorClientDuplex, createSnowflakeStream } from "@hazae41/echalote"
import { None } from "@hazae41/option"
import { Pool, PoolCreatorParams, PoolParams } from "@hazae41/piscine"
import { Result } from "@hazae41/result"

export function createNativeWebSocketPool(params: PoolParams) {
  const pool = new Pool<Disposer<WebSocket>>(async (subparams) => {
    const { index, pool } = subparams

    const socket = new WebSocket("wss://snowflake.torproject.net/")

    socket.binaryType = "arraybuffer"

    await new Promise((ok, err) => {
      socket.addEventListener("open", ok)
      socket.addEventListener("error", err)
    })

    using preProxy = new Box(new Disposer(socket, () => socket.close()))

    const onCloseOrError = (reason?: unknown) => {
      pool.restart(index)
    }

    preProxy.inner.inner.addEventListener("close", onCloseOrError, { passive: true })
    using preOnCloseDisposer = new Box(new Disposer({}, () => preProxy.inner.inner.removeEventListener("close", onCloseOrError)))

    preProxy.inner.inner.addEventListener("error", onCloseOrError, { passive: true })
    using preOnErrorDisposer = new Box(new Disposer({}, () => preProxy.inner.inner.removeEventListener("error", onCloseOrError)))

    const onOffline = () => {
      /**
       * Close socket and thus call onCloseOrError
       */
      preProxy.inner.get().close()
    }

    addEventListener("offline", onOffline, { passive: true })
    const onOfflineClean = () => removeEventListener("offline", onOffline)
    using preOnOfflineDisposer = new Box(new Disposer({}, onOfflineClean))

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

    return new Disposer(proxy, onEntryClean)
  }, params)

  addEventListener("online", async () => {
    await new Promise(ok => setTimeout(ok, 1000))

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

export async function createTorOrThrow(raw: { outer: ReadableWritablePair<Opaque, Writable> }): Promise<TorClientDuplex> {
  const tcp = await createSnowflakeStream(raw)
  const tor = new TorClientDuplex()

  tcp.outer.readable
    .pipeTo(tor.inner.writable)
    .catch(console.error)

  tor.inner.readable
    .pipeTo(tcp.outer.writable)
    .catch(console.error)

  await tor.waitOrThrow()

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

  /**
   * Move all resources
   */
  const torAndConsensus = preTorAndConsensus.moveOrThrow()
  const onCloseDisposer = preOnCloseDisposer.moveOrThrow()
  const onErrorDisposer = preOnErrorDisposer.moveOrThrow()

  const onEntryClean = () => {
    using _0 = torAndConsensus
    using _1 = onCloseDisposer
    using _2 = onErrorDisposer
  }

  return new Disposer(torAndConsensus, onEntryClean)
}

export function createTorPool(sockets: Pool<Disposer<WebSocket>>, params: PoolParams) {
  let update = Date.now()

  const pool = new Pool<Disposer<readonly [TorClientDuplex, Consensus]>>(async (subparams) => {
    while (true) {
      const start = Date.now()

      const result = await Result.runAndDoubleWrap(async () => {
        const { index, signal } = subparams

        using preSocket = await sockets.getOrThrow(index % sockets.capacity, signal).then(r => r.unwrap().inner)
        const stream = new WebSocketDuplex(preSocket.getOrThrow().get(), { shouldCloseOnError: true, shouldCloseOnClose: true })

        using preTor = new Box(await createTorOrThrow(stream))
        using tmpCircuit = await preTor.getOrThrow().createOrThrow(AbortSignal.timeout(5000))
        const consensus = await Consensus.fetchOrThrow(tmpCircuit)

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
      })

      if (result.isOk())
        return result.get()

      if (start < update)
        continue

      throw result.getErr()
    }
  }, params)

  sockets.events.on("started", async i => {
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