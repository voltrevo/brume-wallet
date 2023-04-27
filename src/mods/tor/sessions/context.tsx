import { ChildrenProps } from "@/libs/react/props/children";
import { EthereumChainMap, EthereumSession, EthereumSocketSession } from "@/libs/tor/sessions/session";
import { Mutex } from "@hazae41/mutex";
import { Pool } from "@hazae41/piscine";
import { createContext, useContext, useMemo } from "react";
import { useCircuits } from "../circuits/context";

export const SessionsContext =
  createContext<Mutex<Pool<EthereumChainMap<EthereumSession>>> | undefined>(undefined)

export function useSessions() {
  return useContext(SessionsContext)
}

export function SessionsProvider(props: ChildrenProps) {
  const { children } = props

  const circuits = useCircuits()

  const sessions = useMemo(() => {
    if (!circuits) return

    return new Mutex(EthereumSocketSession.createPool({
      1: {
        id: 1,
        url: "wss://mainnet.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8"
      },
      5: {
        id: 5,
        url: "wss://goerli.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8"
      }
    }, circuits))
  }, [circuits])

  return <SessionsContext.Provider value={sessions}>
    {children}
  </SessionsContext.Provider>
}