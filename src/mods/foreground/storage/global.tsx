import { ChildrenProps } from "@/libs/react/props/children";
import { RawState, Storage, core } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { None, Nullable, Option, Some } from "@hazae41/option";
import { Ok } from "@hazae41/result";
import { createContext, useContext, useMemo } from "react";
import { Background } from "../background/background";
import { useBackgroundContext } from "../background/context";

export const GlobalStorageContext =
  createContext<Nullable<GlobalStorage>>(undefined)

export function useGlobalStorageContext() {
  return Option.wrap(useContext(GlobalStorageContext))
}

export function GlobalStorageProvider(props: ChildrenProps) {
  const { children } = props
  const background = useBackgroundContext().unwrap()

  const storage = useMemo(() => {
    return new GlobalStorage(background)
  }, [background])

  return <GlobalStorageContext.Provider value={storage}>
    {children}
  </GlobalStorageContext.Provider>
}

export class GlobalStorage implements Storage {
  readonly async: true = true

  readonly keys = new Set<string>()

  constructor(
    readonly background: Background
  ) {
    background.ports.get().events.on("created", e => {
      if (e.isErr())
        return new None()
      for (const key of this.keys)
        this.getOrThrow(key).catch(console.warn)
      return new None()
    })
  }

  async getOrThrow(cacheKey: string) {
    this.keys.add(cacheKey)

    this.background.events.on("request", async (request) => {
      if (request.method !== "brume_update")
        return new None()

      const [cacheKey2, stored] = (request as RpcRequestPreinit<[string, Nullable<RawState>]>).params

      if (cacheKey2 !== cacheKey)
        return new None()

      core.storeds.set(cacheKey, stored)
      core.unstoreds.delete(cacheKey)

      await core.onState.emit("*", cacheKey)
      await core.onState.emit(cacheKey, cacheKey)

      return new Some(Ok.void())
    })

    return await this.background.requestOrThrow<RawState>({
      method: "brume_get_global",
      params: [cacheKey]
    }).then(r => r.unwrap())
  }

}