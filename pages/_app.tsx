import { Catcher, FallbackProps } from "@/libs/react/error"
import { CircuitsProvider } from "@/mods/tor/circuits/context"
import { TorProvider } from "@/mods/tor/context"
import { SocketsProvider } from "@/mods/tor/sockets/context"
import '@/styles/globals.css'
import { XSWR } from "@hazae41/xswr"
import type { AppProps } from 'next/app'

export function Fallback(props: FallbackProps) {
  return <>An error occured</>
}

export default function App({ Component, pageProps }: AppProps) {
  return <Catcher fallback={Fallback}>
    <XSWR.CoreProvider>
      <TorProvider>
        <CircuitsProvider>
          <SocketsProvider>
            <Component {...pageProps} />
          </SocketsProvider>
        </CircuitsProvider>
      </TorProvider>
    </XSWR.CoreProvider>
  </Catcher>
}
