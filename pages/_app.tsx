import { Errors } from "@/libs/errors/errors"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { Catcher, PromiseCatcher } from "@/libs/react/error"
import { ErrorProps } from "@/libs/react/props/error"
import { Button } from "@/libs/ui/button"
import { BackgroundProvider } from "@/mods/foreground/background/context"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { PathProvider } from "@/mods/foreground/router/path"
import { GlobalStorageProvider } from "@/mods/foreground/storage/global"
import { UserStorageProvider } from "@/mods/foreground/storage/user"
import "@/styles/index.css"
import { CoreProvider } from "@hazae41/xswr"
import type { AppProps } from 'next/app'
import Head from "next/head"
import { useCallback } from "react"

export function Fallback(props: ErrorProps) {
  const { error } = props

  const reload = useCallback(() => {
    location.reload()
  }, [])

  const reset = useAsyncUniqueCallback(async () => {
    if (!confirm(`You will lose all your wallets if you didn't made backups, are you sure?`))
      return

    const databases = await indexedDB.databases()

    for (const database of databases)
      if (database.name)
        indexedDB.deleteDatabase(database.name)

    localStorage.clear()
    location.reload()
  }, [])

  return <Page>
    <PageHeader title="Error" />
    <PageBody>
      <div className="text-red-500">
        An unexpected error occured
      </div>
      <div className="text-contrast">
        {Errors.toString(error)}
      </div>
    </PageBody>
    <div className="p-4 flex items-center flex-wrap-reverse gap-2">
      <Button.Contrast className="po-md grow"
        onClick={reset.run}>
        Clear everything and reload the page
      </Button.Contrast>
      <Button.Gradient className="po-md grow"
        colorIndex={5}
        onClick={reload}>
        Reload the page
      </Button.Gradient>
    </div>
  </Page>
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
            <GlobalStorageProvider>
              <UserStorageProvider>
                <PathProvider>
                  <Component {...pageProps} />
                </PathProvider>
              </UserStorageProvider>
            </GlobalStorageProvider>
          </BackgroundProvider>
        </CoreProvider>
      </PromiseCatcher>
    </Catcher>
  </>
}
