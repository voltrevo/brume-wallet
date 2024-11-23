import "@hazae41/symbol-dispose-polyfill";

import "@/styles/index.css";

import { Console } from "@/libs/console";
import { Errors } from "@/libs/errors/errors";
import { Catcher, PromiseCatcher } from "@/libs/react/error";
import { ChildrenProps } from "@/libs/react/props/children";
import { ErrorProps } from "@/libs/react/props/error";
import { GlobalPageHeader, PageBody } from "@/libs/ui/page/header";
import { Page } from "@/libs/ui/page/page";
import { BackgroundProvider } from "@/mods/foreground/background/context";
import { WideShrinkableOppositeButton } from "@/mods/foreground/entities/wallets/actions/send";
import { GlobalStorageProvider } from "@/mods/foreground/storage/global";
import { UserStorageProvider } from "@/mods/foreground/storage/user";
import { WalletWasm } from "@brumewallet/wallet.wasm";
import { Base16 } from "@hazae41/base16";
import { Base58 } from "@hazae41/base58";
import { Base64 } from "@hazae41/base64";
import { Base64Url } from "@hazae41/base64url";
import { ChaCha20Poly1305 } from "@hazae41/chacha20poly1305";
import { HashPathProvider, usePathContext } from "@hazae41/chemin";
import { Ed25519 } from "@hazae41/ed25519";
import { Keccak256 } from "@hazae41/keccak256";
import { Ripemd160 } from "@hazae41/ripemd160";
import { Secp256k1 } from "@hazae41/secp256k1";
import { Sha1 } from "@hazae41/sha1";
import { X25519 } from "@hazae41/x25519";
import type { AppProps } from 'next/app';
import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";

export function Fallback(props: ErrorProps) {
  const { error } = props

  const onClick = useCallback(() => {
    location.assign("#/")
    location.reload()
  }, [])

  return <main id="main" className="p-safe h-full w-full flex flex-col overflow-hidden animate-opacity-in">
    <div className="grow w-full flex flex-col overflow-y-scroll">
      <div className="grow w-full m-auto max-w-3xl flex flex-col">
        <Page>
          <GlobalPageHeader title="Error" />
          <PageBody>
            <div className="text-red-400 dark:text-red-500">
              An unexpected error occured
            </div>
            <div className="text-contrast">
              {Errors.toString(error)}
            </div>
            <div className="h-4 grow" />
            <div className="flex items-center flex-wrap-reverse gap-2">
              <WideShrinkableOppositeButton
                onClick={onClick}>
                Go home
              </WideShrinkableOppositeButton>
            </div>
          </PageBody>
        </Page>
      </div>
    </div>
  </main>
}

export async function init() {
  await WalletWasm.initBundled()

  Sha1.set(Sha1.fromWasm(WalletWasm))

  Keccak256.set(Keccak256.fromWasm(WalletWasm))
  Ripemd160.set(Ripemd160.fromWasm(WalletWasm))

  Base16.set(Base16.fromWasm(WalletWasm))
  Base64.set(Base64.fromWasm(WalletWasm))
  Base58.set(Base58.fromWasm(WalletWasm))

  Base64Url.set(Base64Url.fromWasm(WalletWasm))

  Secp256k1.set(Secp256k1.fromWasm(WalletWasm))

  Ed25519.set(await Ed25519.fromNativeOrWasm(WalletWasm))
  X25519.set(X25519.fromWasm(WalletWasm))

  ChaCha20Poly1305.set(ChaCha20Poly1305.fromWasm(WalletWasm))
}

export function Initializer(props: ChildrenProps) {
  const { children } = props

  const [ready, setReady] = useState(false)

  useEffect(() => {
    const gt = globalThis as any
    gt.Console = Console

    init().then(() => setReady(true))
  }, [])

  if (!ready)
    return null

  return <>{children}</>
}

export function ClientOnly(props: ChildrenProps) {
  const { children } = props

  const [client, setClient] = useState(false)

  useEffect(() => {
    setClient(true)
  }, [])

  if (!client)
    return null

  return <>{children}</>
}

export function Goto(props: ChildrenProps) {
  const path = usePathContext().getOrThrow()
  const { children } = props

  const goto = useMemo(() => {
    return path.url.searchParams.get("_")
  }, [path])

  useEffect(() => {
    if (goto == null)
      return
    location.replace(path.go(decodeURIComponent(goto)))
  }, [path, goto])

  if (goto != null)
    return null

  return <>{children}</>
}

export default function App({ Component, pageProps }: AppProps) {
  return <ClientOnly>
    <Head>
      <title>Brume Wallet</title>
    </Head>
    <Catcher fallback={Fallback}>
      <PromiseCatcher>
        <Initializer>
          <HashPathProvider>
            <Goto>
              <BackgroundProvider>
                <GlobalStorageProvider>
                  <UserStorageProvider>
                    <Component {...pageProps} />
                  </UserStorageProvider>
                </GlobalStorageProvider>
              </BackgroundProvider>
            </Goto>
          </HashPathProvider>
        </Initializer>
      </PromiseCatcher>
    </Catcher>
  </ClientOnly>
}
