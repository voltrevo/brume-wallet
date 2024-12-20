import { ChildrenProps } from "@/libs/react/props/children";
import { QueryStorage, RawState, core } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Nullable, Option, Some } from "@hazae41/option";
import { Ok } from "@hazae41/result";
import { createContext, useContext, useMemo } from "react";
import { Background } from "../../../background/background";
import { useBackgroundContext } from "../../../background/context";

export const UserStorageContext =
  createContext<Nullable<UserStorage>>(undefined)

export function useUserStorageContext() {
  return Option.wrap(useContext(UserStorageContext))
}

export function UserStorageProvider(props: ChildrenProps) {
  const background = useBackgroundContext().getOrThrow()
  const { children } = props

  const storage = useMemo(() => {
    return new UserStorage(background)
  }, [background])

  return <UserStorageContext value={storage}>
    {children}
  </UserStorageContext>
}

export class UserStorage implements QueryStorage {
  readonly async: true = true

  readonly keys = new Set<string>()

  constructor(
    readonly background: Background
  ) {
    background.ports.get().events.on("created", e => {
      if (e.isErr())
        return
      for (const key of this.keys)
        this.getOrThrow(key).catch(console.warn)
      return
    })
  }

  async getOrThrow(cacheKey: string) {
    this.keys.add(cacheKey)

    this.background.events.on("request", async (request) => {
      if (request.method !== "brume_update")
        return

      const [cacheKey2, stored] = (request as RpcRequestPreinit<[string, Nullable<RawState>]>).params

      if (cacheKey2 !== cacheKey)
        return

      core.storeds.set(cacheKey, stored)
      core.unstoreds.delete(cacheKey)

      await core.onState.emit("*", cacheKey)
      await core.onState.emit(cacheKey, cacheKey)

      return new Some(Ok.void())
    })

    return await this.background.requestOrThrow<RawState>({
      method: "brume_get_user",
      params: [cacheKey]
    }).then(r => r.getOrThrow())
  }

  async setOrThrow(cacheKey: string, value: Nullable<RawState>): Promise<void> {
    return await this.background.requestOrThrow<void>({
      method: "brume_set_user",
      params: [cacheKey, value]
    }).then(r => r.getOrThrow())
  }

}