import { ChildrenProps } from "@/libs/react/props/children";
import { SocketPool } from "@/libs/tor/sockets/pool";
import { createContext, useContext, useMemo } from "react";
import { useCircuits } from "../circuits/context";

export const SocketsContext =
  createContext<SocketPool | undefined>(undefined)

export function useSockets() {
  return useContext(SocketsContext)!
}

export function SocketsProvider(props: ChildrenProps) {
  const { children } = props

  const circuits = useCircuits()

  const sockets = useMemo(() => {
    if (!circuits) return

    const url = new URL("wss://goerli.infura.io/ws/v3/b6bf7d3508c941499b10025c0776eaf8")

    return new SocketPool(url, circuits)
  }, [circuits])

  return <SocketsContext.Provider value={sockets}>
    {children}
  </SocketsContext.Provider>
}