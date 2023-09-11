import "@hazae41/symbol-dispose-polyfill"

import "@/styles/index.css"

import { Errors } from "@/libs/errors/errors"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { useEffectButOnlyFirstTime } from "@/libs/react/effect"
import { Catcher, PromiseCatcher } from "@/libs/react/error"
import { ChildrenProps } from "@/libs/react/props/children"
import { ErrorProps } from "@/libs/react/props/error"
import { Button } from "@/libs/ui/button"
import { BackgroundProvider } from "@/mods/foreground/background/context"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { PathProvider } from "@/mods/foreground/router/path"
import { GlobalStorageProvider } from "@/mods/foreground/storage/global"
import { UserStorageProvider } from "@/mods/foreground/storage/user"
import { Alocer } from "@hazae41/alocer"
import { Base16 } from "@hazae41/base16"
import { Base58 } from "@hazae41/base58"
import { Base64 } from "@hazae41/base64"
import { Base64Url } from "@hazae41/base64url"
import { Berith } from "@hazae41/berith"
import { Ed25519 } from "@hazae41/ed25519"
import { Keccak256 } from "@hazae41/keccak256"
import { Morax } from "@hazae41/morax"
import { Sha1 } from "@hazae41/sha1"
import { X25519 } from "@hazae41/x25519"
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

async function initBerith() {
  await Berith.initBundledOnce()
  Ed25519.set(await Ed25519.fromNativeOrBerith(Berith))
  X25519.set(await X25519.fromSafeOrBerith(Berith))
}

async function initMorax() {
  await Morax.initBundledOnce()
  Keccak256.set(Keccak256.fromMorax(Morax))
  Sha1.set(Sha1.fromMorax(Morax))
}

async function initAlocer() {
  await Alocer.initBundledOnce()
  Base16.set(Base16.fromBufferOrAlocer(Alocer))
  Base64.set(Base64.fromBufferOrAlocer(Alocer))
  Base64Url.set(Base64Url.fromBufferOrAlocer(Alocer))
  Base58.set(Base58.fromAlocer(Alocer))
}

export function Initializer(props: ChildrenProps) {
  useEffectButOnlyFirstTime(() => {
    initBerith()
    initMorax()
    initAlocer()
  }, [])

  return <>{props.children}</>
}

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Head>
      <title>Brume Wallet</title>
      <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
    </Head>
    <Catcher fallback={Fallback}>
      <PromiseCatcher>
        <Initializer>
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
        </Initializer>
      </PromiseCatcher>
    </Catcher>
  </>
}
