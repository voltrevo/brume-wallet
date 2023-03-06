import { ChildrenProps } from "@/libs/react/props/children";
import { SessionPool } from "@/libs/tor/sessions/pool";
import { createContext, useContext, useMemo } from "react";
import { useCircuits } from "../circuits/context";

export const SessionsContext =
  createContext<SessionPool | undefined>(undefined)

export function useSessions() {
  return useContext(SessionsContext)!
}

export function SessionsProvider(props: ChildrenProps) {
  const { children } = props

  const circuits = useCircuits()

  const sessions = useMemo(() => {
    if (!circuits) return

    const url = new URL("wss://goerli.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8")

    return new SessionPool(url, circuits)
  }, [circuits])

  return <SessionsContext.Provider value={sessions}>
    {children}
  </SessionsContext.Provider>
}