import { Fallback, TorClientDuplex, TorClientParams, createPooledTor, createWebSocketSnowflakeStream } from "@hazae41/echalote"
import { Mutex } from "@hazae41/mutex"
import { Cancel, Looped, Looper, Pool, PoolParams, Retry, TooManyRetriesError, tryLoop } from "@hazae41/piscine"
import { AbortedError } from "@hazae41/plume"
import { Ok, Result } from "@hazae41/result"

export interface CreateTorParams extends Omit<TorClientParams, "fallbacks"> {
  fallbacks: Result<Fallback[], Error>
}

export async function tryCreateTor(params: CreateTorParams): Promise<Result<TorClientDuplex, Cancel<Error> | Retry<Error>>> {
  return await Result.unthrow(async t => {
    const fallbacks = params.fallbacks.mapErrSync(Cancel.new).throw(t)

    const tcp = await createWebSocketSnowflakeStream("wss://snowflake.torproject.net/")
    const tor = new TorClientDuplex(tcp, { ...params, fallbacks })

    await tor.tryWait().then(r => r.mapErrSync(Retry.new).throw(t))

    return new Ok(tor)
  })
}

export function createTorPool<CreateError extends Looped.Infer<CreateError>>(tryCreate: Looper<TorClientDuplex, CreateError>, params: PoolParams = {}) {
  return new Mutex(new Pool<TorClientDuplex, Cancel.Inner<CreateError> | AbortedError | TooManyRetriesError>(async (params) => {
    return await Result.unthrow(async t => {
      const tor = await tryLoop(tryCreate, params).then(r => r.throw(t))

      return new Ok(createPooledTor(tor, params))
    })
  }, params))
}