import "@hazae41/symbol-dispose-polyfill"

import "@/styles/index.css"

import { Console } from "@/libs/console"
import { Errors } from "@/libs/errors/errors"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { Catcher, PromiseCatcher } from "@/libs/react/error"
import { ErrorProps } from "@/libs/react/props/error"
import { GlobalPageHeader, PageBody } from "@/libs/ui2/page/header"
import { Page } from "@/libs/ui2/page/page"
import { BackgroundProvider } from "@/mods/foreground/background/context"
import { WideShrinkableContrastButton, WideShrinkableOppositeButton } from "@/mods/foreground/entities/wallets/actions/send"
import { DefaultPathProvider } from "@/mods/foreground/router/path/context"
import { GlobalStorageProvider } from "@/mods/foreground/storage/global"
import { UserStorageProvider } from "@/mods/foreground/storage/user"
import { Base16 } from "@hazae41/base16"
import { Base58 } from "@hazae41/base58"
import { Base64 } from "@hazae41/base64"
import { Base64Url } from "@hazae41/base64url"
import { ChaCha20Poly1305 } from "@hazae41/chacha20poly1305"
import { Ed25519 } from "@hazae41/ed25519"
import { Keccak256 } from "@hazae41/keccak256"
import { Ripemd160 } from "@hazae41/ripemd160"
import { Secp256k1 } from "@hazae41/secp256k1"
import { Sha1 } from "@hazae41/sha1"
import { X25519 } from "@hazae41/x25519"
import type { AppProps } from 'next/app'
import Head from "next/head"
import { useCallback, useEffect } from "react"

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
    <GlobalPageHeader title="Error" />
    <PageBody>
      <div className="text-red-500">
        An unexpected error occured
      </div>
      <div className="text-contrast">
        {Errors.toString(error)}
      </div>
      <div className="h-4 grow" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideShrinkableContrastButton
          onClick={reset.run}>
          Clear everything and reload the page
        </WideShrinkableContrastButton>
        <WideShrinkableOppositeButton
          onClick={reload}>
          Reload the page
        </WideShrinkableOppositeButton>
      </div>
    </PageBody>
  </Page>
}

async function initBerith() {
  Ed25519.set(await Ed25519.fromSafeOrBerith())
  X25519.set(await X25519.fromSafeOrBerith())
}

async function initEligos() {
  Secp256k1.set(await Secp256k1.fromEligos())
}

async function initMorax() {
  Keccak256.set(await Keccak256.fromMorax())
  Sha1.set(await Sha1.fromMorax())
  Ripemd160.set(await Ripemd160.fromMorax())
}

async function initAlocer() {
  Base16.set(await Base16.fromBufferOrAlocer())
  Base64.set(await Base64.fromBufferOrAlocer())
  Base64Url.set(await Base64Url.fromBufferOrAlocer())
  Base58.set(await Base58.fromAlocer())
}

async function initZepar() {
  ChaCha20Poly1305.set(await ChaCha20Poly1305.fromZepar())
}

export function Initializer(props: {}) {
  useEffect(() => {
    const gt = globalThis as any
    gt.Console = Console

    initBerith()
    initEligos()
    initMorax()
    initAlocer()
    initZepar()
  }, [])

  return null
}

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Head>
      <title>Brume Wallet</title>
      <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
    </Head>
    <Catcher fallback={Fallback}>
      <PromiseCatcher>
        <Initializer />
        <DefaultPathProvider>
          <BackgroundProvider>
            <GlobalStorageProvider>
              <UserStorageProvider>
                <Component {...pageProps} />
              </UserStorageProvider>
            </GlobalStorageProvider>
          </BackgroundProvider>
        </DefaultPathProvider>
      </PromiseCatcher>
    </Catcher>
  </>
}
