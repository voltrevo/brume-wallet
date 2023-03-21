import { ChildrenProps } from "@/libs/react/props/children";
import { createSessionPool } from "@/libs/tor/sessions/pool";
import { Session } from "@/libs/tor/sessions/session";
import { Pool } from "@hazae41/piscine";
import { createContext, useContext, useMemo } from "react";
import { useCircuits } from "../circuits/context";

export const SessionsContext =
  createContext<Pool<Session> | undefined>(undefined)

export function useSessions() {
  return useContext(SessionsContext)
}

export function SessionsProvider(props: ChildrenProps) {
  const { children } = props

  const circuits = useCircuits()

  const sessions = useMemo(() => {
    if (!circuits) return

    const url = new URL("wss://goerli.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8")

    return createSessionPool(url, circuits)
  }, [circuits])

  return <SessionsContext.Provider value={sessions}>
    {children}
  </SessionsContext.Provider>
}