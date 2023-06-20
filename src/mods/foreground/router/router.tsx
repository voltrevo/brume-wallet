import { ConnectPage, SwitchPage } from "pages/popup"
import { WalletsPage } from "../entities/wallets/all/page"
import { WalletPage } from "../entities/wallets/page"
import { usePath } from "./path"

export function Router() {
  const url = usePath()

  let matches: RegExpMatchArray | null

  if (url.pathname === "")
    return <WalletsPage />

  if (matches = url.pathname.match(/^\/$/))
    return <WalletsPage />

  if (matches = url.pathname.match(/^\/wallets$/))
    return <WalletsPage />

  if (matches = url.pathname.match(/^\/wallet\/([^\/]+)$/))
    return <WalletPage uuid={matches[1]} />

  if (matches = url.pathname.match(/^\/eth_requestAccounts$/))
    return <ConnectPage />

  if (matches = url.pathname.match(/^\/wallet_switchEthereumChain$/))
    return <SwitchPage />

  return <>Error 404</>
}