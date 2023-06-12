import { Errors } from "@/libs/errors/errors"
import { useAsyncCallback } from "@/libs/react/callback"
import { Catcher, PromiseCatcher } from "@/libs/react/error"
import { ErrorProps } from "@/libs/react/props/error"
import { UserProvider } from "@/mods/foreground/entities/users/context"
import { ExtensionProvider } from "@/mods/foreground/extension/context"
import { Overlay } from "@/mods/foreground/overlay/overlay"
import { CircuitsProvider } from "@/mods/foreground/tor/circuits/context"
import { TorPoolProvider } from "@/mods/foreground/tor/context"
import { SessionsProvider } from "@/mods/foreground/tor/sessions/context"
import '@/styles/globals.css'
import { CoreProvider } from "@hazae41/xswr"
import type { AppProps } from 'next/app'
import Head from "next/head"

export function Fallback(props: ErrorProps) {
  const { error } = props

  const reset = useAsyncCallback(async () => {
    if (!confirm(`You will lose all your wallets if you didn't made backups, are you sure?`))
      return

    const databases = await indexedDB.databases()

    for (const database of databases)
      if (database.name)
        indexedDB.deleteDatabase(database.name)

    localStorage.clear()
    location.reload()
  }, [])

  return <div className="p-4">
    <div className="text-red-500">
      An unexpected error occured
    </div>
    <div className="text-contrast">
      {Errors.toString(error)}
    </div>
    <div className="h-2" />
    <button className="px-2 border border-contrast rounded-xl"
      onClick={reset}>
      Click me to clear everything
    </button>
  </div>
}

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Head>
      <title>Brume Wallet</title>
    </Head>
    <Catcher fallback={Fallback}>
      <PromiseCatcher>
        <ExtensionProvider>
          <Overlay>
            <CoreProvider>
              <UserProvider>
                <TorPoolProvider>
                  <CircuitsProvider>
                    <SessionsProvider>
                      <Component {...pageProps} />
                    </SessionsProvider>
                  </CircuitsProvider>
                </TorPoolProvider>
              </UserProvider>
            </CoreProvider>
          </Overlay>
        </ExtensionProvider>
      </PromiseCatcher>
    </Catcher>
  </>
}
