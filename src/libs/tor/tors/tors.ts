import { Creator, TorClientDuplex, TorClientParams, createPooledTor, createWebSocketSnowflakeStream, tryCreateLoop } from "@hazae41/echalote"
import { Mutex } from "@hazae41/mutex"
import { Pool, PoolParams } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"

export async function tryCreateTor(params: TorClientParams): Promise<Result<TorClientDuplex, Error>> {
  const tcp = await createWebSocketSnowflakeStream("wss://snowflake.torproject.net/")
  const tor = new TorClientDuplex(tcp, params)

  return tor.tryWait().then(r => r.mapSync(() => tor))
}

export function createTorPool<CreateError>(tryCreate: Creator<TorClientDuplex, CreateError>, params: PoolParams = {}) {
  return new Mutex(new Pool<TorClientDuplex, Error | CreateError>(async (params) => {
    return await Result.unthrow(async t => {
      const tor = await tryCreateLoop(tryCreate, params).then(r => r.throw(t))

      return new Ok(createPooledTor(tor, params))
    })
  }, params))
}