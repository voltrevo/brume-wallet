import { useAsyncMemo } from "@/libs/react/memo";
import { ChildrenProps } from "@/libs/react/props/children";
import { createTorPool, tryCreateTor } from "@/libs/tor/tors/tors";
import { Berith } from "@hazae41/berith";
import { Fallback, TorClientDuplex } from "@hazae41/echalote";
import { Ed25519 } from "@hazae41/ed25519";
import { Morax } from "@hazae41/morax";
import { Mutex } from "@hazae41/mutex";
import { Pool } from "@hazae41/piscine";
import { Catched, Err, Ok, Result } from "@hazae41/result";
import { Sha1 } from "@hazae41/sha1";
import { X25519 } from "@hazae41/x25519";
import { createContext, useContext } from "react";

export const TorPoolContext =
  createContext<Mutex<Pool<TorClientDuplex, Error>> | undefined>(undefined)

export function useTorPool() {
  return useContext(TorPoolContext)
}

const FALLBACKS_URL = "https://raw.githubusercontent.com/hazae41/echalote/master/tools/fallbacks/fallbacks.json"

async function tryFetch<T>(url: string): Promise<Result<T, Error>> {
  try {
    const res = await fetch(url)

    if (!res.ok)
      return new Err(new Error(await res.text()))
    return new Ok(await res.json() as T)
  } catch (e: unknown) {
    return new Err(Catched.from(e))
  }
}

export function TorPoolProvider(props: ChildrenProps) {
  const { children } = props

  const params = useAsyncMemo(async () => {
    await Berith.initBundledOnce()
    await Morax.initBundledOnce()

    const ed25519 = Ed25519.fromBerith(Berith)
    const x25519 = X25519.fromBerith(Berith)
    const sha1 = Sha1.fromMorax(Morax)

    const fallbacks = await tryFetch<Fallback[]>(FALLBACKS_URL)

    return { fallbacks, ed25519, x25519, sha1 }
  }, [])

  const tors = useAsyncMemo(async () => {
    if (!params) return

    const tors = createTorPool(async () => {
      return await tryCreateTor(params)
    }, { capacity: 3 })

    return tors
  }, [params])

  return <TorPoolContext.Provider value={tors}>
    {children}
  </TorPoolContext.Provider>
}