import { ChildrenProps } from "@/libs/react/props/children";
import { RpcParamfulRequestInit } from "@/libs/rpc";
import { Mutex } from "@hazae41/mutex";
import { None, Option, Optional, Some } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { Core, RawState, Storage, useCore } from "@hazae41/xswr";
import { createContext, useContext, useRef } from "react";
import { Background } from "../background/background";
import { useBackground } from "../background/context";

export const UserStorageContext =
  createContext<Optional<UserStorage>>(undefined)

export function useUserStorage() {
  return Option.wrap(useContext(UserStorageContext))
}

export function UserStorageProvider(props: ChildrenProps) {
  const { children } = props
  const core = useCore().unwrap()
  const background = useBackground()

  const storage = useRef<UserStorage>()

  if (storage.current == null)
    storage.current = new UserStorage(core, background)

  return <UserStorageContext.Provider value={storage.current}>
    {children}
  </UserStorageContext.Provider>
}

export class UserStorage implements Storage {
  readonly async: true = true

  readonly keys = new Mutex(new Set<string>())

  constructor(
    readonly core: Core,
    readonly background: Background
  ) { }

  async get(cacheKey: string) {
    return await this.tryGet(cacheKey).then(r => r.unwrap().unwrap())
  }

  async tryGet(cacheKey: string) {
    return await this.background.tryRequest<RawState>({ method: "brume_get_user", params: [cacheKey] })
  }

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

        const stored = await this.tryGet(cacheKey).then(r => r.throw(t).throw(t))

        const unstored = await this.core.unstore(stored, { key: cacheKey })
        this.core.update(cacheKey, () => unstored, { key: cacheKey })

        return Ok.void()
      })
    })
  }

}