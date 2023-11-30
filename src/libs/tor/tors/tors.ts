import { Box } from "@hazae41/box"
import { TorClientDuplex, createTorEntry, createWebSocketSnowflakeStream } from "@hazae41/echalote"
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
  return new Pool<TorClientDuplex>(async (params) => {
    return await Result.unthrow(async t => {
      using tor = new Box(await tryCreateTor().then(r => r.throw(t)))
      return new Ok(createTorEntry(tor.moveOrThrow(), params))
    })
  }, params)
}