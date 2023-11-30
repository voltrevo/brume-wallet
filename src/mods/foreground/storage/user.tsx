import { ChildrenProps } from "@/libs/react/props/children";
import { RawState, Storage, core } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { None, Nullable, Option, Some } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { createContext, useContext, useMemo } from "react";
import { Background } from "../background/background";
import { useBackgroundContext } from "../background/context";

export const UserStorageContext =
  createContext<Nullable<UserStorage>>(undefined)

export function useUserStorageContext() {
  return Option.wrap(useContext(UserStorageContext))
}

export function UserStorageProvider(props: ChildrenProps) {
  const { children } = props
  const background = useBackgroundContext().unwrap()

  const storage = useMemo(() => {
    return new UserStorage(background)
  }, [background])

  return <UserStorageContext.Provider value={storage}>
    {children}
  </UserStorageContext.Provider>
}

export class UserStorage implements Storage {
  readonly async: true = true

  readonly keys = new Mutex(new Set<string>())

  constructor(
    readonly background: Background
  ) {
    background.ports.events.on("created", e => {
      if (e.isErr())
        return new None()
      for (const key of this.keys.inner)
        this.#trySubscribe(key)
      return new None()
    })
  }

  async tryGet(cacheKey: string) {
    return await this.background.tryRequest<RawState>({
      method: "brume_get_user",
      params: [cacheKey]
    }).then(r => r.flatten())
  }

  async trySet(cacheKey: string, value: Nullable<RawState>): Promise<Result<void, Error>> {
    return await this.background.tryRequest<void>({
      method: "brume_set_user",
      params: [cacheKey, value]
    }).then(r => r.flatten())
  }

  async #trySubscribe(cacheKey: string): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      await this.background
        .tryRequest<void>({ method: "brume_subscribe", params: [cacheKey] })
        .then(r => r.throw(t).throw(t))

      this.background.events.on("request", async (request) => {
        if (request.method !== "brume_update")
          return new None()

        const [cacheKey2, stored] = (request as RpcRequestPreinit<[string, Nullable<RawState>]>).params

        if (cacheKey2 !== cacheKey)
          return new None()

        core.storeds.set(cacheKey, stored)
        core.unstoreds.delete(cacheKey)
        await core.onState.emit(cacheKey, [])

        return new Some(Ok.void())
      })

      const stored = await this.tryGet(cacheKey).then(r => r.throw(t))

      core.storeds.set(cacheKey, stored)
      core.unstoreds.delete(cacheKey)
      await core.onState.emit(cacheKey, [])

      return Ok.void()
    })
  }

  async trySubscribe(cacheKey: string): Promise<Result<void, Error>> {
    return await Result.unthrow(async t => {
      return this.keys.lock(async (keys) => {
        if (keys.has(cacheKey))
          return Ok.void()

        await this.#trySubscribe(cacheKey).then(r => r.throw(t))
        keys.add(cacheKey)

        return Ok.void()
      })
    })
  }

}