import { ChildrenProps } from "@/libs/react/props/children"
import { DonePage, PersonalSignPage, SwitchPage, TransactPage, TypedSignPage, WalletAndChainSelectPage } from "pages/popup"
import { useBackgroundContext } from "../background/context"
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
import { Bottom } from "../overlay/bottom"
import { usePathContext } from "./path/context"

export function Layout(props: ChildrenProps) {
  const { children } = props

  return <UserGuard>
    <div className="grow w-full flex flex-col overflow-y-scroll">
      <div className="grow w-full m-auto max-w-3xl flex flex-col">
        {children}
      </div>
    </div>
    <Bottom />
  </UserGuard>
}

export function Router() {
  const { url } = usePathContext().unwrap()
  const background = useBackgroundContext().unwrap()

  let matches: RegExpMatchArray | null

  if ((matches = url.pathname.match(/^(\/)?$/)) && background.isWebsite())
    return <FullLandingPage next="#/home" />

  if ((matches = url.pathname.match(/^(\/)?$/)) && background.isExtension())
    return <EmptyLandingPage next="#/home" />

  if (matches = url.pathname.match(/^\/home(\/)?$/))
    return <Layout>
      <HomePage />
    </Layout>

  if (matches = url.pathname.match(/^\/wallets(\/)?$/))
    return <Layout>
      <WalletsPage />
    </Layout>

  if (matches = url.pathname.match(/^\/wallets(\/)trash(\/)?$/))
    return <Layout>
      <TrashedWalletsPage />
    </Layout>

  if (matches = url.pathname.match(/^\/seeds(\/)?$/))
    return <Layout>
      <SeedsPage />
    </Layout>

  if (matches = url.pathname.match(/^\/sessions(\/)?$/))
    return <Layout>
      <SessionsPage />
    </Layout>

  if (matches = url.pathname.match(/^\/requests(\/)?$/))
    return <Layout>
      <RequestsPage />
    </Layout>

  if (matches = url.pathname.match(/^\/plugins(\/)?$/))
    return <Layout>
      <SnapsPage />
    </Layout>

  if (matches = url.pathname.match(/^\/wallet\/([^\/]+)(\/)?$/))
    return <Layout>
      <WalletPage uuid={matches[1]} />
    </Layout>

  if (matches = url.pathname.match(/^\/wallet\/([^\/]+)\/camera(\/)?$/))
    return <Layout>
      <WalletCameraPage uuid={matches[1]} />
    </Layout>

  if (matches = url.pathname.match(/^\/seed\/([^\/]+)(\/)?$/))
    return <Layout>
      <SeedPage uuid={matches[1]} />
    </Layout>

  if (matches = url.pathname.match(/^\/settings(\/)?$/))
    return <Layout>
      <SettingsPage />
    </Layout>

  if (matches = url.pathname.match(/^\/eth_requestAccounts(\/)?$/))
    return <Layout>
      <WalletAndChainSelectPage />
    </Layout>

  if (matches = url.pathname.match(/^\/eth_sendTransaction(\/)?$/))
    return <Layout>
      <TransactPage />
    </Layout>

  if (matches = url.pathname.match(/^\/wallet_switchEthereumChain(\/)?$/))
    return <Layout>
      <SwitchPage />
    </Layout>

  if (matches = url.pathname.match(/^\/personal_sign(\/)?$/))
    return <Layout>
      <PersonalSignPage />
    </Layout>

  if (matches = url.pathname.match(/^\/eth_signTypedData_v4(\/)?$/))
    return <Layout>
      <TypedSignPage />
    </Layout>

  if (matches = url.pathname.match(/^\/done(\/)?$/))
    return <Layout>
      <DonePage />
    </Layout>

  return <FullLandingPage />
}