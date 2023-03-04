import { Catcher } from "@/libs/react/error"
import { ErrorProps } from "@/libs/react/props/error"
import { CircuitsProvider } from "@/mods/tor/circuits/context"
import { TorProvider } from "@/mods/tor/context"
import { TorFallback } from "@/mods/tor/fallback"
import { SocketsProvider } from "@/mods/tor/sockets/context"
import '@/styles/globals.css'
import { XSWR } from "@hazae41/xswr"
import type { AppProps } from 'next/app'

export function Fallback(props: ErrorProps) {
  const { error } = props

  return <>An error occured</>
}

export default function App({ Component, pageProps }: AppProps) {
  return <Catcher fallback={Fallback}>
    <XSWR.CoreProvider>
      <TorProvider fallback={TorFallback}>
        <CircuitsProvider>
          <SocketsProvider>
            <Component {...pageProps} />
          </SocketsProvider>
        </CircuitsProvider>
      </TorProvider>
    </XSWR.CoreProvider>
  </Catcher>
}
