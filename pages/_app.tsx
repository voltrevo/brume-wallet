import { Errors } from "@/libs/errors/errors"
import { useAsyncCallback } from "@/libs/react/callback"
import { Catcher } from "@/libs/react/error"
import { ErrorProps } from "@/libs/react/props/error"
import { UserProvider } from "@/mods/foreground/entities/users/context"
import { Overlay } from "@/mods/foreground/overlay/overlay"
import { GlobalStorageProvider } from "@/mods/foreground/storage/global/context"
import { UserStorageProvider } from "@/mods/foreground/storage/user/context"
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
      <meta key="application-name" name="application-name" content="Brume Wallet" />
      <meta key="description" name="description" content="The private wallet" />
      <meta key="color-scheme" name="color-scheme" content="dark light" />
      <meta key="theme-color-light" name="theme-color" content="#ffffff" />
      <meta key="theme-color-dark" name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
      <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
      <meta key="apple-mobile-web-app-capable" name="apple-mobile-web-app-capable" content="yes" />
      <meta key="apple-mobile-web-app-status-bar-style" name="apple-mobile-web-app-status-bar-style" content="white" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/square.png" />
      <link rel="apple-touch-startup-image" href="/round.png" />
    </Head>
    <Catcher fallback={Fallback}>
      <CoreProvider>
        <GlobalStorageProvider>
          <Overlay>
            <UserProvider>
              <UserStorageProvider>
                <TorPoolProvider>
                  <CircuitsProvider>
                    <SessionsProvider>
                      <Component {...pageProps} />
                    </SessionsProvider>
                  </CircuitsProvider>
                </TorPoolProvider>
              </UserStorageProvider>
            </UserProvider>
          </Overlay>
        </GlobalStorageProvider>
      </CoreProvider>
    </Catcher>
  </>
}
