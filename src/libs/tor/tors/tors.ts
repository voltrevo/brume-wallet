import { Box } from "@hazae41/box"
import { Disposer } from "@hazae41/cleaner"
import { Consensus, TorClientDuplex, createWebSocketSnowflakeStream } from "@hazae41/echalote"
import { None } from "@hazae41/option"
import { Pool, PoolParams } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"

export async function tryCreateTor(): Promise<Result<TorClientDuplex, Error>> {
  return await Result.unthrow(async t => {
    const tcp = await createWebSocketSnowflakeStream("wss://snowflake.torproject.net/")
    const tor = new TorClientDuplex()

    tcp.outer.readable
      .pipeTo(tor.inner.writable)
      .catch(console.error)

    tor.inner.readable
      .pipeTo(tcp.outer.writable)
      .catch(console.error)

    await tor.tryWait().then(r => r.throw(t))

    return new Ok(tor)
  })
}

export function createTorPool(params: PoolParams) {
  const pool = new Pool<readonly [TorClientDuplex, Consensus]>(async (params) => {
    return await Result.unthrow(async t => {
      using tor = new Box(await tryCreateTor().then(r => r.throw(t)))

      using circuit = await tor.inner.createOrThrow(AbortSignal.timeout(5000))
      const consensus = await Consensus.fetchOrThrow(circuit)

      using torAndConsensus = new Box([tor.unwrapOrThrow(), consensus] as const)

      function createTorAndConsensusEntry(torAndConsensus: Box<readonly [TorClientDuplex, Consensus]>) {
        const { pool, index } = params

        const onCloseOrError = async (reason?: unknown) => {
          pool.restart(index)
          return new None()
        }

        torAndConsensus.inner[0].events.on("close", onCloseOrError, { passive: true })
        torAndConsensus.inner[0].events.on("error", onCloseOrError, { passive: true })

        const onOffline = () => {
          torAndConsensus.inner[0].close()
        }

        addEventListener("offline", onOffline, { passive: true })

        const onClean = () => {
          using postTorAndConsensus = torAndConsensus

          torAndConsensus.inner[0].events.off("close", onCloseOrError)
          torAndConsensus.inner[0].events.off("error", onCloseOrError)

          removeEventListener("offline", onOffline)
        }

        return new Disposer(torAndConsensus, onClean)
      }

      return new Ok(createTorAndConsensusEntry(torAndConsensus.moveOrThrow()))
    })
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