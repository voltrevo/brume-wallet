import { XSWR } from "@hazae41/xswr"
import { CircuitProvider } from "mods/contexts/circuit/context"
import { TorProvider } from "mods/contexts/tor/context"
import type { AppProps } from 'next/app'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return <XSWR.CoreProvider>
    <TorProvider>
      <CircuitProvider>
        <Component {...pageProps} />
      </CircuitProvider>
    </TorProvider>
  </XSWR.CoreProvider>
}
