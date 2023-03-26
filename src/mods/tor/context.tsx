import fallbacks from "@/assets/fallbacks.json";
import { useAsyncMemo } from "@/libs/react/memo";
import { ChildrenProps } from "@/libs/react/props/children";
import { Berith } from "@hazae41/berith";
import { createWebSocketSnowflakeStream, TorClientDuplex } from "@hazae41/echalote";
import { Ed25519 } from "@hazae41/ed25519";
import { X25519 } from "@hazae41/x25519";
import { createContext, useContext } from "react";

export const TorContext =
  createContext<TorClientDuplex | undefined>(undefined)

export function useTor() {
  return useContext(TorContext)
}

export function TorProvider(props: ChildrenProps) {
  const { children } = props

  const tor = useAsyncMemo(async () => {
    await Berith.initBundledOnce()

    const ed25519 = Ed25519.fromBerith(Berith)
    const x25519 = X25519.fromBerith(Berith)

    const tcp = await createWebSocketSnowflakeStream("wss://snowflake.bamsoftware.com/")

    return new TorClientDuplex(tcp, { fallbacks, ed25519, x25519 })
  }, [])

  return <TorContext.Provider value={tor}>
    {children}
  </TorContext.Provider>
}