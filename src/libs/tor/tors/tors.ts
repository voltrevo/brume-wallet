import { WebSocketStream } from "@/libs/streams/websocket"
import { Opaque, Writable } from "@hazae41/binary"
import { Box } from "@hazae41/box"
import { Disposer } from "@hazae41/cleaner"
import { Consensus, TorClientDuplex, createSnowflakeStream } from "@hazae41/echalote"
import { None } from "@hazae41/option"
import { Pool, PoolParams } from "@hazae41/piscine"
import { Ok } from "@hazae41/result"

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

export function createTorPool(params: PoolParams & { socket?: WebSocket }) {
  const pool = new Pool<Disposer<readonly [TorClientDuplex, Consensus]>>(async (subparams) => {
    const { socket = new WebSocket("wss://snowflake.torproject.net/") } = params

    const raw = WebSocketStream.fromOrThrow(socket, { shouldCloseOnAbort: true, shouldCloseOnCancel: true })
    using preTor = new Box(await createTorOrThrow(raw))

    using circuit = await preTor.getOrThrow().createOrThrow(AbortSignal.timeout(5000))
    const consensus = await Consensus.fetchOrThrow(circuit)

    const tor = preTor.unwrapOrThrow()

    const onTorAndConsensusClean = () => {
      using _ = tor
    }

    using preTorAndConsensus = new Box(new Disposer([tor, consensus] as const, onTorAndConsensusClean))

    const { pool, index } = subparams

    const onCloseOrError = async (reason?: unknown) => {
      pool.restart(index)
      return new None()
    }

    preTorAndConsensus.getOrThrow().inner[0].events.on("close", onCloseOrError, { passive: true })
    using preCloseCleaner = new Box(new Disposer(preTorAndConsensus.getOrThrow().inner, ([tor]) => tor.events.off("close", onCloseOrError)))

    preTorAndConsensus.getOrThrow().inner[0].events.on("error", onCloseOrError, { passive: true })
    using preErrorCleaner = new Box(new Disposer(preTorAndConsensus.getOrThrow().inner, ([tor]) => tor.events.off("error", onCloseOrError)))

    const onOffline = () => {
      preTorAndConsensus.inner.inner[0].close()
    }

    addEventListener("offline", onOffline, { passive: true })
    using preOfflineCleaner = new Box(new Disposer({}, () => removeEventListener("offline", onOffline)))

    const torAndConsensus = preTorAndConsensus.moveOrThrow()

    const closeCleaner = preCloseCleaner.moveOrThrow()
    const errorCleaner = preErrorCleaner.moveOrThrow()
    const offlineCleaner = preOfflineCleaner.moveOrThrow()

    const onEntryClean = () => {
      using _0 = torAndConsensus
      using _1 = closeCleaner
      using _2 = errorCleaner
      using _3 = offlineCleaner
    }

    return new Ok(new Disposer(torAndConsensus, onEntryClean))
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