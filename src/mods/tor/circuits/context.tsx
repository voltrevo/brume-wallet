import { usePoolChange } from "@/libs/pools/pools";
import { ChildrenProps } from "@/libs/react/props/children";
import { createCircuitPool } from "@/libs/tor/circuits/circuits";
import { Circuit } from "@hazae41/echalote";
import { Mutex } from "@hazae41/mutex";
import { Pool } from "@hazae41/piscine";
import { Ok } from "@hazae41/result";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useTorPool } from "../context";

export const CircuitsContext =
  createContext<Mutex<Pool<Circuit, Error>> | undefined>(undefined)

export function useCircuits() {
  return useContext(CircuitsContext)
}

export function CircuitsProvider(props: ChildrenProps) {
  const { children } = props

  const tors = useTorPool()

  const circuits = useMemo(() => {
    if (!tors) return

    return createCircuitPool(tors, { capacity: 3 })
  }, [tors])

  const onPoolChange = useCallback((pool: Pool<Circuit, Error>) => {
    console.log(`Circuits pool: ${pool.size}/${pool.capacity}`)

    return Ok.void()
  }, [])

  usePoolChange(circuits?.inner, onPoolChange)

  return <CircuitsContext.Provider value={circuits}>
    {children}
  </CircuitsContext.Provider>
}