import { usePoolChange } from "@/libs/pools/pools";
import { ChildrenProps } from "@/libs/react/props/children";
import { EthereumSessions, createEthereumSessionsPool } from "@/libs/tor/sessions/session";
import { Mutex } from "@hazae41/mutex";
import { Pool } from "@hazae41/piscine";
import { Ok } from "@hazae41/result";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useCircuits } from "../circuits/context";

export const SessionsContext =
  createContext<Mutex<Pool<EthereumSessions>> | undefined>(undefined)

export function useSessionsPool() {
  return useContext(SessionsContext)
}

export function SessionsProvider(props: ChildrenProps) {
  const { children } = props

  const circuits = useCircuits()

  const sessions = useMemo(() => {
    if (!circuits) return

    return new Mutex(createEthereumSessionsPool({
      1: {
        id: 1,
        url: "wss://eth.llamarpc.com",
        etherscan: "https://etherscan.io"
      },
      5: {
        id: 5,
        url: "wss://goerli.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8",
        etherscan: "https://goerli.etherscan.io"
      },
      137: {
        id: 137,
        url: "wss://polygon.llamarpc.com",
        etherscan: "https://polygonscan.com"
      }
    }, circuits))
  }, [circuits])

  const onPoolChange = useCallback((pool: Pool<EthereumSessions>) => {
    console.log(`Sessions pool: ${pool.size}/${pool.capacity}`)

    return Ok.void()
  }, [])

  usePoolChange(sessions?.inner, onPoolChange)

  return <SessionsContext.Provider value={sessions}>
    {children}
  </SessionsContext.Provider>
}