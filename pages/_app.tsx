import { CircuitProvider } from "@/mods/tor/circuits/context"
import { TorProvider } from "@/mods/tor/context"
import '@/styles/globals.css'
import { XSWR } from "@hazae41/xswr"
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <XSWR.CoreProvider>
    <TorProvider>
      <CircuitProvider>
        <Component {...pageProps} />
      </CircuitProvider>
    </TorProvider>
  </XSWR.CoreProvider>
}
