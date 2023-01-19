import { Circuit, Tor } from "@hazae41/echalote";
import { createContext, useContext, useEffect, useState } from "react";
import { ChildrenProps } from "utils/react/props";
import { useTor } from "../tor/context";

export const CircuitContext =
  createContext<Circuit | undefined>(undefined)

export function useCircuit() {
  return useContext(CircuitContext)!
}

async function createCircuit(tor: Tor) {
  while (true)
    try {
      const circuit = await tor.create()

      await circuit.extend(false)
      await circuit.extend(true)

      return circuit
    } catch (e: unknown) {
      console.warn("Could not create circuit", e)
    }
}

export function CircuitProvider(props: ChildrenProps) {
  const { children } = props

  const tor = useTor()

  const [circuit, setCircuit] = useState<Circuit>()

  useEffect(() => {
    if (!tor) return

    createCircuit(tor).then(setCircuit)
  }, [tor])

  if (!circuit)
    return <div className="p-md flex flex-col items-center">
      <div className="h-2" />
      <div className="flex items-center gap-4">
        <span className="text-3xl text-center text-colored">
          Brume Wallet
        </span>
      </div>
      <div className="h-[150px]" />
      <div className="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
      <div className="h-[100px]" />
      <span className="text-2xl text-center">
        Creating a Tor circuit...
      </span>
      <div className="h-[20px]" />
      <span className="text-center text-contrast">
        It may take a few seconds. If it freezes, close the extension window and open it again.
      </span>
    </div>

  return <CircuitContext.Provider value={circuit}>
    {children}
  </CircuitContext.Provider>
}