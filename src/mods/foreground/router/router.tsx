import { isWebsite } from "@/libs/platform/platform"
import { ChildrenProps } from "@/libs/react/props/children"
import { DonePage, PersonalSignPage, TransactPage, TypedSignPage, WalletAndChainSelectPage } from "@/pages/popup"
import { usePathContext } from "@hazae41/chemin"
import { Address } from "@hazae41/cubane"
import { Nullable } from "@hazae41/option"
import { useEffect, useState } from "react"
import { RequestsPage } from "../entities/requests/all/page"
import { SeedsPage } from "../entities/seeds/all/page"
import { SeedPage } from "../entities/seeds/page"
import { SessionsPage } from "../entities/sessions/all/page"
import { SettingsPage } from "../entities/settings/page"
import { SnapsPage } from "../entities/snaps/all/page"
import { EmptyLandingPage, FullLandingPage } from "../entities/users/all/page"
import { UserGuard } from "../entities/users/context"
import { WalletsPage } from "../entities/wallets/all/page"
import { TrashedWalletsPage } from "../entities/wallets/all/trash/page"
import { WalletCameraPage } from "../entities/wallets/camera/page"
import { WalletPage } from "../entities/wallets/page"
import { HomePage } from "../home/page"
import { Overlay } from "../overlay/overlay"

export function Layout(props: ChildrenProps) {
  const { children } = props

  return <Overlay>
    <UserGuard>
      {children}
    </UserGuard>
  </Overlay>
}

export function Router() {
  const path = usePathContext().getOrThrow()

  if (path.url.origin !== location.origin)
    return <X />

  let matches: RegExpMatchArray | null

  if ((matches = path.url.pathname.match(/^(\/)?$/)) && isWebsite())
    return <Overlay>
      <FullLandingPage next="#/home" />
    </Overlay>

  if ((matches = path.url.pathname.match(/^(\/)?$/)) && !isWebsite())
    return <Overlay>
      <EmptyLandingPage next="#/home" />
    </Overlay>

  if (matches = path.url.pathname.match(/^\/home(\/)?$/))
    return <Layout>
      <HomePage />
    </Layout>

  if (matches = path.url.pathname.match(/^\/wallets(\/)?$/))
    return <Layout>
      <WalletsPage />
    </Layout>

  if (matches = path.url.pathname.match(/^\/wallets\/trash(\/)?$/))
    return <Layout>
      <TrashedWalletsPage />
    </Layout>

  if (matches = path.url.pathname.match(/^\/seeds(\/)?$/))
    return <Layout>
      <SeedsPage />
    </Layout>

  if (matches = path.url.pathname.match(/^\/sessions(\/)?$/))
    return <Layout>
      <SessionsPage />
    </Layout>

  if (matches = path.url.pathname.match(/^\/requests(\/)?$/))
    return <Layout>
      <RequestsPage />
    </Layout>

  if (matches = path.url.pathname.match(/^\/plugins(\/)?$/))
    return <Layout>
      <SnapsPage />
    </Layout>

  if (matches = path.url.pathname.match(/^\/wallet\/([^\/]+)(\/)?$/))
    return <Layout>
      <WalletPage uuid={matches[1]} />
    </Layout>

  if (matches = path.url.pathname.match(/^\/wallet\/([^\/]+)\/camera(\/)?$/))
    return <Layout>
      <WalletCameraPage uuid={matches[1]} />
    </Layout>

  if (matches = path.url.pathname.match(/^\/seed\/([^\/]+)(\/)?$/))
    return <Layout>
      <SeedPage uuid={matches[1]} />
    </Layout>

  if (matches = path.url.pathname.match(/^\/settings(\/)?$/))
    return <Layout>
      <SettingsPage />
    </Layout>

  if (matches = path.url.pathname.match(/^\/eth_requestAccounts(\/)?$/))
    return <Layout>
      <WalletAndChainSelectPage />
    </Layout>

  if (matches = path.url.pathname.match(/^\/eth_sendTransaction(\/)?$/))
    return <Layout>
      <TransactPage />
    </Layout>

  if (matches = path.url.pathname.match(/^\/personal_sign(\/)?$/))
    return <Layout>
      <PersonalSignPage />
    </Layout>

  if (matches = path.url.pathname.match(/^\/eth_signTypedData_v4(\/)?$/))
    return <Layout>
      <TypedSignPage />
    </Layout>

  if (matches = path.url.pathname.match(/^\/done(\/)?$/))
    return <Layout>
      <DonePage />
    </Layout>

  if (isWebsite())
    return <Overlay>
      <FullLandingPage />
    </Overlay>

  return <Overlay>
    <EmptyLandingPage />
  </Overlay>
}

export type GnosisRpcRequestInit<T = unknown> = undefined extends T
  ? GnosisRpcParamlessRequestInit<T>
  : GnosisRpcParamfulRequestInit<T>

export interface GnosisRpcParamlessRequestInit<T> {
  readonly id: string
  readonly env: GnosisRpcEnv
  readonly method: string
  readonly params?: T
}

export interface GnosisRpcParamfulRequestInit<T> {
  readonly id: string
  readonly env: GnosisRpcEnv
  readonly method: string
  readonly params: NonNullable<T>
}

export interface GnosisRpcEnv {
  readonly sdkVersion: string
}

export type GnosisRpcResponseInit<T = unknown> =
  | GnosisRpcOk<T>

export interface GnosisRpcOk<T = unknown> {
  readonly id: string
  readonly version: string
  readonly success: true
  readonly data: T
}

export interface GnosisRpcSafeInfoResult {
  readonly chainId: number
  readonly fallbackHandler: Address.From
  readonly guard: null
  readonly implementation: Address.From
  readonly isReadOnly: boolean
  readonly modules: Address.From[]
  readonly network: "MAINNET"
  readonly nonce: number
  readonly owners: Address.From[]
  readonly safeAddress: Address.From
  readonly threshold: number
  readonly version: "1.1.1"
}

export interface GnosisRpcCallParams<T = unknown> {
  readonly call: string
  readonly params: T
}

export function X() {
  const path = usePathContext().getOrThrow()

  const [iframe, setIframe] = useState<Nullable<HTMLIFrameElement>>()

  useEffect(() => {
    if (iframe == null)
      return
    const window = iframe.contentWindow

    if (window == null)
      return

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window)
        return
      const request = event.data as GnosisRpcRequestInit

      if (request.method === "getSafeInfo") {
        const { id } = request
        const version = "9.1.0"

        const data: GnosisRpcSafeInfoResult = {
          chainId: 1,
          fallbackHandler: "0xd5D82B6aDDc9027B22dCA772Aa68D5d74cdBdF44",
          guard: null,
          implementation: "0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F",
          isReadOnly: false,
          modules: ["0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134"],
          network: "MAINNET",
          nonce: 0,
          owners: ['0x9F87C1aCaF3Afc6a5557c58284D9F8609470b571', '0x8712128BEA09C9687Df05A5D692F3750F8086C81', '0x80F59C1D46EFC1Bb18F0AaEc132b77266f00Be9a', '0x9F7dfAb2222A473284205cdDF08a677726d786A0'],
          safeAddress: "0xfF501B324DC6d78dC9F983f140B9211c3EdB4dc7",
          threshold: 2,
          version: "1.1.1"
        }

        const response = { id, version, success: true, data }
        event.source.postMessage(response, event.origin)
        return
      }

      if (request.method === "rpcCall") {
        const { id, params } = request as GnosisRpcRequestInit<GnosisRpcCallParams>

      }

      console.log(request)
    }

    addEventListener("message", onMessage)
    return () => removeEventListener("message", onMessage)
  }, [iframe])

  return <iframe className="grow w-full"
    ref={setIframe}
    src={path.url.href}
    seamless />
}