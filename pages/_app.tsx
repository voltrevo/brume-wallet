import { Errors } from "@/libs/errors/errors"
import { useAsyncCallback } from "@/libs/react/callback"
import { Catcher, PromiseCatcher } from "@/libs/react/error"
import { ErrorProps } from "@/libs/react/props/error"
import { BackgroundProvider } from "@/mods/foreground/background/context"
import { PathProvider } from "@/mods/foreground/router/path"
import { UserStorageProvider } from "@/mods/foreground/storage/context"
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
      <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
    </Head>
    <Catcher fallback={Fallback}>
      <PromiseCatcher>
        <CoreProvider>
          <BackgroundProvider>
            <UserStorageProvider>
              <PathProvider>
                <Component {...pageProps} />
              </PathProvider>
            </UserStorageProvider>
          </BackgroundProvider>
        </CoreProvider>
      </PromiseCatcher>
    </Catcher>
  </>
}
