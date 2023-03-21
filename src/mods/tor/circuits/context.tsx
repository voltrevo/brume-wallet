import { ChildrenProps } from "@/libs/react/props/children";
import { Circuit, createCircuitPool } from "@hazae41/echalote";
import { Pool } from "@hazae41/piscine";
import { createContext, useContext, useMemo } from "react";
import { useTor } from "../context";

export const CircuitsContext =
  createContext<Pool<Circuit> | undefined>(undefined)

export function useCircuits() {
  return useContext(CircuitsContext)
}

export function CircuitsProvider(props: ChildrenProps) {
  const { children } = props

  const tor = useTor()

  const circuits = useMemo(() => {
    if (!tor) return

    return createCircuitPool(tor, {})
  }, [tor])

  return <CircuitsContext.Provider value={circuits}>
    {children}
  </CircuitsContext.Provider>
}