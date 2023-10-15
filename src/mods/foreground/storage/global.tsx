import { ChildrenProps } from "@/libs/react/props/children";
import { RawState, Storage, core } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { None, Nullable, Option, Some } from "@hazae41/option";
import { Ok, Result } from "@hazae41/result";
import { createContext, useContext, useMemo } from "react";
import { Background } from "../background/background";
import { useBackground } from "../background/context";

export const GlobalStorageContext =
  createContext<Nullable<GlobalStorage>>(undefined)

export function useGlobalStorage() {
  return Option.wrap(useContext(GlobalStorageContext))
}

export function GlobalStorageProvider(props: ChildrenProps) {
  const { children } = props
  const background = useBackground().unwrap()

  const storage = useMemo(() => {
    return new GlobalStorage(background)
  }, [background])

  return <GlobalStorageContext.Provider value={storage}>
    {children}
  </GlobalStorageContext.Provider>
}

export class GlobalStorage implements Storage {
  readonly async: true = true

  readonly keys = new Mutex(new Set<string>())

  constructor(
    readonly background: Background
  ) {
    background.ports.events.on("created", e => {
      if (e.result.isErr())
        return new None()
      for (const key of this.keys.inner)
        this.#trySubscribe(key)
      return new None()
    })
  }

  async tryGet(cacheKey: string) {
    return await this.background.tryRequest<RawState>({
      method: "brume_get_global",
      params: [cacheKey]
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
        core.onState.dispatchEvent(new CustomEvent(cacheKey))
        return new Some(Ok.void())
      })

      const stored = await this.tryGet(cacheKey).then(r => r.throw(t))

      core.storeds.set(cacheKey, stored)
      core.unstoreds.delete(cacheKey)
      core.onState.dispatchEvent(new CustomEvent(cacheKey))

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