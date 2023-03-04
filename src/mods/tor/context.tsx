import fallbacks from "@/assets/fallbacks.json";
import { useAsyncMemo } from "@/libs/react/memo";
import { ChildrenProps } from "@/libs/react/props/children";
import { FallbackProps } from "@/libs/react/props/fallback";
import { createWebSocketSnowflakeStream, TorClientDuplex } from "@hazae41/echalote";
import { createContext, useContext } from "react";

export const TorContext =
  createContext<TorClientDuplex | undefined>(undefined)

export function useTor() {
  return useContext(TorContext)!
}

export function TorProvider(props: ChildrenProps & FallbackProps<{}>) {
  const { children, fallback: Fallback } = props

  const tor = useAsyncMemo(async () => {
    const tcp = await createWebSocketSnowflakeStream("wss://snowflake.bamsoftware.com/")
    const tor = new TorClientDuplex(tcp, { fallbacks })

    return tor
  }, [])

  if (!tor) return <Fallback />

  return <TorContext.Provider value={tor}>
    {children}
  </TorContext.Provider>
}