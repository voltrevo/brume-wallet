import { Box } from "@hazae41/box"
import { Disposer } from "@hazae41/cleaner"
import { TorClientDuplex, createWebSocketSnowflakeStream } from "@hazae41/echalote"
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
  const pool = new Pool<TorClientDuplex>(async (params) => {
    return await Result.unthrow(async t => {
      using tor = new Box(await tryCreateTor().then(r => r.throw(t)))

      function createTorEntry(tor: Box<TorClientDuplex>) {
        const { pool, index } = params

        const onCloseOrError = async (reason?: unknown) => {
          pool.restart(index)
          return new None()
        }

        tor.inner.events.on("close", onCloseOrError, { passive: true })
        tor.inner.events.on("error", onCloseOrError, { passive: true })

        const onOffline = () => {
          tor.inner.close()
        }

        addEventListener("offline", onOffline, { passive: true })

        const onClean = () => {
          using posttor = tor

          tor.inner.events.off("close", onCloseOrError)
          tor.inner.events.off("error", onCloseOrError)

          removeEventListener("offline", onOffline)
        }

        return new Disposer(tor, onClean)
      }

      return new Ok(createTorEntry(tor.moveOrThrow()))
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