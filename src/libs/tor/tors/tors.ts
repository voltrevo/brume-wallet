import { WebSocketStream } from "@/libs/streams/websocket"
import { Opaque, Writable } from "@hazae41/binary"
import { Box } from "@hazae41/box"
import { Disposer } from "@hazae41/disposer"
import { Consensus, TorClientDuplex, createSnowflakeStream } from "@hazae41/echalote"
import { None } from "@hazae41/option"
import { Pool, PoolCreatorParams, PoolParams } from "@hazae41/piscine"

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

  const onOffline = () => {
    /**
     * Close Tor and thus call onCloseOrError
     */
    rawTorAndConsensus.inner[0].close()
  }

  addEventListener("offline", onOffline, { passive: true })
  const onOfflineClean = () => removeEventListener("offline", onOffline)
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

export function createTorPool(params: PoolParams & { socket?: WebSocket }) {
  const pool = new Pool<Disposer<readonly [TorClientDuplex, Consensus]>>(async (subparams) => {
    const { socket = new WebSocket("wss://snowflake.torproject.net/") } = params

    socket.binaryType = "arraybuffer"

    await new Promise((ok, err) => {
      socket.addEventListener("open", ok)
      socket.addEventListener("error", err)
    })

    const stream = WebSocketStream.fromOrThrow(socket, {
      shouldCloseOnAbort: true,
      shouldCloseOnCancel: true
    })

    using preTor = new Box(await createTorOrThrow(stream))
    using tmpCircuit = await preTor.getOrThrow().createOrThrow(AbortSignal.timeout(5000))
    const consensus = await Consensus.fetchOrThrow(tmpCircuit)

    /**
     * Move Tor into a new struct with [TorClientDuplex, Consensus]
     */
    const tor = preTor.unwrapOrThrow()

    const onTorAndConsensusClean = () => {
      using _ = tor
    }

    using preTorAndConsensus = new Box(new Disposer([tor, consensus] as const, onTorAndConsensusClean))

    /**
     * NOOP
     */

    return createTorAndConsensusEntry(preTorAndConsensus.moveOrThrow(), subparams)
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