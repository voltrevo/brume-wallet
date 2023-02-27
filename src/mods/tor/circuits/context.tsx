import { ChildrenProps } from "@/libs/react/props/children";
import { CircuitPool } from "@hazae41/echalote";
import { createContext, useContext, useMemo } from "react";
import { useTor } from "../context";

export const CircuitsContext =
  createContext<CircuitPool | undefined>(undefined)

export function useCircuits() {
  return useContext(CircuitsContext)!
}

export function CircuitsProvider(props: ChildrenProps) {
  const { children } = props

  const tor = useTor()

  const circuits = useMemo(() => {
    return new CircuitPool(tor, {})
  }, [tor])

  return <CircuitsContext.Provider value={circuits}>
    {children}
  </CircuitsContext.Provider>
}