import { Catcher } from "@/libs/react/error"
import { ErrorProps } from "@/libs/react/props/error"
import { Overlay } from "@/mods/overlay/overlay"
import { CircuitsProvider } from "@/mods/tor/circuits/context"
import { TorProvider } from "@/mods/tor/context"
import { SessionsProvider } from "@/mods/tor/sessions/context"
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
      <TorProvider>
        <CircuitsProvider>
          <SessionsProvider>
            <Overlay>
              <Component {...pageProps} />
            </Overlay>
          </SessionsProvider>
        </CircuitsProvider>
      </TorProvider>
    </XSWR.CoreProvider>
  </Catcher>
}
