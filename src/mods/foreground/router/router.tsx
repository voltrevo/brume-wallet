import { DonePage, PersonalSignPage, SwitchPage, TransactPage, TypedSignPage, WalletAndChainSelectPage } from "pages/popup"
import { SessionsPage } from "../entities/sessions/all/page"
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

  if (matches = url.pathname.match(/^\/sessions$/))
    return <SessionsPage />

  if (matches = url.pathname.match(/^\/wallet\/([^\/]+)$/))
    return <WalletPage uuid={matches[1]} />

  if (matches = url.pathname.match(/^\/eth_requestAccounts$/))
    return <WalletAndChainSelectPage />

  if (matches = url.pathname.match(/^\/eth_sendTransaction$/))
    return <TransactPage />

  if (matches = url.pathname.match(/^\/wallet_switchEthereumChain$/))
    return <SwitchPage />

  if (matches = url.pathname.match(/^\/personal_sign$/))
    return <PersonalSignPage />

  if (matches = url.pathname.match(/^\/eth_signTypedData_v4$/))
    return <TypedSignPage />

  if (matches = url.pathname.match(/^\/done$/))
    return <DonePage />

  return <>Error 404</>
}