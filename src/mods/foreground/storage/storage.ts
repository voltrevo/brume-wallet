import { RpcParamfulRequestInit } from "@/libs/rpc"
import { Mutex } from "@hazae41/mutex"
import { None, Optional, Some } from "@hazae41/option"
import { Ok, Result } from "@hazae41/result"
import { Core, Query, RawState } from "@hazae41/xswr"
import { useEffect } from "react"
import { Background } from "../background/background"

export class Subscriber {
  readonly keys = new Mutex(new Set<string>())

  constructor(
    readonly core: Core,
    readonly background: Background
  ) { }

  async trySubscribe(cacheKey: string): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      return this.keys.lock(async (keys) => {
        if (keys.has(cacheKey))
          return Ok.void()

        await this.background
          .tryRequest<void>({ method: "brume_subscribe", params: [cacheKey] })
          .then(r => r.throw(t).throw(t))

        this.background.events.on("request", async (request) => {
          if (request.method !== "brume_update")
            return new None()

          const [cacheKey2, stored] = (request as RpcParamfulRequestInit<[string, Optional<RawState>]>).params

          if (cacheKey2 !== cacheKey)
            return new None()

          const unstored = await this.core.unstore(stored, { key: cacheKey })
          this.core.update(cacheKey, () => unstored, { key: cacheKey })

          return new Some(Ok.void())
        })

        keys.add(cacheKey)

        return Ok.void()
      })
    })
  }

}

export interface Subscribable {
  trySubscribe(cacheKey: string): Promise<Result<void, Error>>
}

export function useSubscribe<K, D, F>(query: Query<K, D, F>, storage: Subscribable) {
  const { cacheKey } = query

  useEffect(() => {
    if (cacheKey == null)
      return
    storage.trySubscribe(cacheKey).then(r => r.ignore())
  }, [cacheKey, storage])
}
