import { RpcParamfulRequestInit, RpcResponse } from "@/libs/rpc"
import { Mutex } from "@hazae41/mutex"
import { None, Nullable, Some } from "@hazae41/option"
import { Ok, Result } from "@hazae41/result"
import { Core, RawState, Storage } from "@hazae41/xswr"
import { Background } from "../background/background"

export class GlobalStorage implements Storage {
  readonly async: true = true

  constructor(
    readonly background: Background
  ) { }

  async get(cacheKey: string) {
    return await this.background
      .tryRequest<RawState>({ method: "brume_get_global", params: [cacheKey] })
      .then(r => r.unwrap().unwrap())
  }

}

export class UserStorage implements Storage {
  readonly async: true = true

  readonly keys = new Mutex(new Set<string>())

  constructor(
    readonly core: Core,
    readonly background: Background
  ) { }

  async get(cacheKey: string) {
    return await this.background
      .tryRequest<RawState>({ method: "brume_get_user", params: [cacheKey] })
      .then(r => r.ok().inner?.ok().inner)
  }

  async trySubscribe(cacheKey: string): Promise<Result<void, Error>> {
    return this.keys.lock(async (keys) => {
      if (keys.has(cacheKey))
        return Ok.void()

      return await Result.unthrow(async t => {
        await this.background
          .tryRequest<void>({ method: "brume_subscribe", params: [cacheKey] })
          .then(r => r.throw(t).throw(t))

        this.background.events.onMessage.push(async request => {
          if (request.method !== "brume_update")
            return new None()

          const [cacheKey2, stored] = (request as RpcParamfulRequestInit<[string, Nullable<RawState>]>).params

          if (cacheKey2 !== cacheKey)
            return new None()

          const unstored = await this.core.unstore(stored ?? undefined, {})
          this.core.update(cacheKey, () => unstored, {})

          return new Some(RpcResponse.rewrap(request.id, Ok.void()))
        })

        keys.add(cacheKey)

        return Ok.void()
      })
    })
  }

}