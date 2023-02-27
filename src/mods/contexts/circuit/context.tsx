import { Circuit } from "@hazae41/echalote";
import { ChildrenProps } from "libs/react/props";
import { createContext, useContext, useEffect, useState } from "react";
import { useTor } from "../tor/context";

export const CircuitContext =
  createContext<Circuit | undefined>(undefined)

export function useCircuit() {
  return useContext(CircuitContext)!
}

export function CircuitProvider(props: ChildrenProps) {
  const { children } = props

  const tor = useTor()

  const [circuit, setCircuit] = useState<Circuit>()

  useEffect(() => {
    if (!tor) return

    tor.tryCreateAndExtend().then(setCircuit)
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