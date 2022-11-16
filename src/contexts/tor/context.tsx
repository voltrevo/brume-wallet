import { TlsOverHttp, Tor } from "@hazae41/echalote";
import { createContext, useContext, useEffect, useState } from "react";
import { ChildrenProps } from "utils/react/props";

async function createTlsOverHttp() {
  while (true)
    try {
      const headers = new Headers({ "x-session-id": crypto.randomUUID() })
      const request = new Request("https://meek.bamsoftware.com/", { headers })

      const tls = new TlsOverHttp(request)
      await tls.open()
      return tls
    } catch (e: unknown) {
      console.warn(e)
    }
}

async function createTor() {
  const tls = await createTlsOverHttp()

  while (true)
    try {
      const tor = new Tor(tls)
      await tor.init()
      await tor.handshake()
      return tor
    } catch (e: unknown) {
      console.warn(e)
    }
}

export const TorContext =
  createContext<Tor | undefined>(undefined)

export function useTor() {
  return useContext(TorContext)!
}

export function TorProvider(props: ChildrenProps) {
  const { children } = props

  const [tor, setTor] = useState<Tor>()

  useEffect(() => {
    createTor().then(setTor)
  }, [])

  if (!tor)
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
        Connecting to Tor...
      </span>
      <div className="h-[20px]" />
      <span className="text-center text-contrast">
        It may take a few seconds. If it freezes, close the extension window and open it again.
      </span>
    </div>

  return <TorContext.Provider value={tor}>
    {children}
  </TorContext.Provider>
}