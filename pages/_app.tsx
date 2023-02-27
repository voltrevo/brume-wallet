import { CircuitsProvider } from "@/mods/tor/circuits/context"
import { TorProvider } from "@/mods/tor/context"
import '@/styles/globals.css'
import { XSWR } from "@hazae41/xswr"
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <XSWR.CoreProvider>
    <TorProvider>
      <CircuitsProvider>
        <Component {...pageProps} />
      </CircuitsProvider>
    </TorProvider>
  </XSWR.CoreProvider>
}
