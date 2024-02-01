import { ChildrenProps } from "@/libs/react/props/children";
import { RawState, Storage, core } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { None, Nullable, Option, Some } from "@hazae41/option";
import { Ok } from "@hazae41/result";
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
        this.#subscribeOrThrow(key)
      return new None()
    })
  }

  async getOrThrow(cacheKey: string) {
    await this.#subscribeOrThrow(cacheKey)

    return await this.background.tryRequest<RawState>({
      method: "brume_get_user",
      params: [cacheKey]
    }).then(r => r.unwrap().unwrap())
  }

  async setOrThrow(cacheKey: string, value: Nullable<RawState>): Promise<void> {
    return await this.background.tryRequest<void>({
      method: "brume_set_user",
      params: [cacheKey, value]
    }).then(r => r.unwrap().unwrap())
  }

  async #subscribeOrThrow(cacheKey: string): Promise<void> {
    return this.keys.lock(async (keys) => {
      if (keys.has(cacheKey))
        return

      await this.background.tryRequest<void>({
        method: "brume_subscribe",
        params: [cacheKey]
      }).then(r => r.unwrap().unwrap())

      this.background.events.on("request", async (request) => {
        if (request.method !== "brume_update")
          return new None()

        const [cacheKey2, stored] = (request as RpcRequestPreinit<[string, Nullable<RawState>]>).params

        if (cacheKey2 !== cacheKey)
          return new None()

        core.storeds.set(cacheKey, stored)
        core.unstoreds.delete(cacheKey)

        await core.onState.emit("*", [cacheKey])
        await core.onState.emit(cacheKey, [cacheKey])

        return new Some(Ok.void())
      })

      keys.add(cacheKey)
    })
  }

}