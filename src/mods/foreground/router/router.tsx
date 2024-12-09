import { isWebsite } from "@/libs/platform/platform"
import { DonePage, PersonalSignPage, TransactPage, TypedSignPage, WalletAndChainSelectPage } from "@/pages/popup"
import { usePathContext } from "@hazae41/chemin"
import { Address } from "@hazae41/cubane"
import { Nullable } from "@hazae41/option"
import { useEffect, useMemo, useState } from "react"
import { RequestsPage } from "../entities/requests/all/page"
import { SeedsPage } from "../entities/seeds/all/page"
import { SeedPage } from "../entities/seeds/page"
import { SessionsPage } from "../entities/sessions/all/page"
import { SnapsPage } from "../entities/snaps/all/page"
import { UserGuard } from "../entities/users/context"
import { WalletsPage } from "../entities/wallets/all/page"
import { TrashedWalletsPage } from "../entities/wallets/all/trash/page"
import { WalletCameraPage } from "../entities/wallets/camera/page"
import { WalletPage } from "../entities/wallets/page"
import { GlobalSettingsPage } from "../global/mods/settings/mods/page"
import { HomePage } from "../home/page"
import { EmptyLandingPage, FullLandingPage } from "../landing"
import { Overlay } from "../overlay/overlay"
import { UserSettingsPage } from "../user/mods/settings/mods/page"

export function Router() {
  const path = usePathContext().getOrThrow()

  if (path.url.origin !== location.origin)
    return <Sandbox />

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
    return <Overlay>
      <UserGuard>
        <HomePage />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/wallets(\/)?$/))
    return <Overlay>
      <UserGuard>
        <WalletsPage />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/wallets\/trash(\/)?$/))
    return <Overlay>
      <UserGuard>
        <TrashedWalletsPage />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/seeds(\/)?$/))
    return <Overlay>
      <UserGuard>
        <SeedsPage />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/sessions(\/)?$/))
    return <Overlay>
      <UserGuard>
        <SessionsPage />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/requests(\/)?$/))
    return <Overlay>
      <UserGuard>
        <RequestsPage />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/plugins(\/)?$/))
    return <Overlay>
      <UserGuard>
        <SnapsPage />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/wallet\/([^\/]+)(\/)?$/))
    return <Overlay>
      <UserGuard>
        <WalletPage uuid={matches[1]} />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/wallet\/([^\/]+)\/camera(\/)?$/))
    return <Overlay>
      <UserGuard>
        <WalletCameraPage uuid={matches[1]} />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/seed\/([^\/]+)(\/)?$/))
    return <Overlay>
      <UserGuard>
        <SeedPage uuid={matches[1]} />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/settings\/global(\/)?$/))
    return <Overlay>
      <GlobalSettingsPage />
    </Overlay>

  if (matches = path.url.pathname.match(/^\/settings\/user(\/)?$/))
    return <Overlay>
      <UserGuard>
        <UserSettingsPage />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/eth_requestAccounts(\/)?$/))
    return <Overlay>
      <UserGuard>
        <WalletAndChainSelectPage />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/eth_sendTransaction(\/)?$/))
    return <Overlay>
      <UserGuard>
        <TransactPage />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/personal_sign(\/)?$/))
    return <Overlay>
      <UserGuard>
        <PersonalSignPage />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/eth_signTypedData_v4(\/)?$/))
    return <Overlay>
      <UserGuard>
        <TypedSignPage />
      </UserGuard>
    </Overlay>

  if (matches = path.url.pathname.match(/^\/done(\/)?$/))
    return <Overlay>
      <DonePage />
    </Overlay>

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

export function Sandbox() {
  const path = usePathContext().getOrThrow()

  const [iframe, setIframe] = useState<Nullable<HTMLIFrameElement>>()

  const window = useMemo(() => {
    console.log("iframe", iframe, iframe?.contentWindow)
    return iframe?.contentWindow
  }, [iframe])

  useEffect(() => {
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
  }, [window])

  return <iframe className="grow w-full"
    ref={setIframe}
    onLoad={console.log}
    src={path.url.href}
    seamless />
}