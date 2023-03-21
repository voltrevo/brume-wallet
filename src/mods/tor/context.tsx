import fallbacks from "@/assets/fallbacks.json";
import { useAsyncMemo } from "@/libs/react/memo";
import { ChildrenProps } from "@/libs/react/props/children";
import { createWebSocketSnowflakeStream, TorClientDuplex } from "@hazae41/echalote";
import { createContext, useContext } from "react";

export const TorContext =
  createContext<TorClientDuplex | undefined>(undefined)

export function useTor() {
  return useContext(TorContext)
}

export function TorProvider(props: ChildrenProps) {
  const { children } = props

  const tor = useAsyncMemo(async () => {
    const tcp = await createWebSocketSnowflakeStream("wss://snowflake.bamsoftware.com/")

    return new TorClientDuplex(tcp, { fallbacks })
  }, [])

  return <TorContext.Provider value={tor}>
    {children}
  </TorContext.Provider>
}