import { Fallback, TorClientDuplex, TorClientParams, createPooledTor, createWebSocketSnowflakeStream } from "@hazae41/echalote"
import { Mutex } from "@hazae41/mutex"
import { Cancel, Creator, Pool, PoolParams, tryCreateLoop } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"

export interface CreateTorParams extends Omit<TorClientParams, "fallbacks"> {
  fallbacks: Result<Fallback[], Error>
}

export async function tryCreateTor2(params: CreateTorParams): Promise<Result<TorClientDuplex, Cancel<Error>>> {
  return await Result.unthrow(async t => {
    const fallbacks = params.fallbacks.mapErrSync(Cancel.new).throw(t)

    const tcp = await createWebSocketSnowflakeStream("wss://snowflake.torproject.net/")
    const tor = new TorClientDuplex(tcp, { ...params, fallbacks })

    tor.tryWait().then(r => r.mapErrSync(Cancel.new).throw(t))

    return new Ok(tor)
  })
}

export async function tryCreateTor(params: TorClientParams): Promise<Result<TorClientDuplex, Cancel<Error>>> {
  return await Result.unthrow(async t => {
    const tcp = await createWebSocketSnowflakeStream("wss://snowflake.torproject.net/")
    const tor = new TorClientDuplex(tcp, params)

    tor.tryWait().then(r => r.mapErrSync(Cancel.new).throw(t))

    return new Ok(tor)
  })
}

export function createTorPool<CancelError, RetryError>(tryCreate: Creator<TorClientDuplex, CancelError, RetryError>, params: PoolParams = {}) {
  return new Mutex(new Pool<TorClientDuplex, Error | CancelError>(async (params) => {
    return await Result.unthrow(async t => {
      const tor = await tryCreateLoop(tryCreate, params).then(r => r.throw(t))

      return new Ok(createPooledTor(tor, params))
    })
  }, params))
}