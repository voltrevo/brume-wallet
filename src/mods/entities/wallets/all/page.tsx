/* eslint-disable @next/next/no-img-element */
import { useBoolean } from "@/libs/react/handles/boolean"
import { OkProps } from "@/libs/react/props/promise"
import { OppositeTextButton } from "@/mods/components/button"
import { useRouter } from "next/router"
import { useCallback } from "react"
import { Wallet, WalletProps } from "../data"
import { WalletRow } from "../row"
import { WalletCreatorDialog } from "./create"
import { useWallets } from "./data"

export function WalletsPage(props: {}) {
  const router = useRouter()
  const wallets = useWallets()
  const creator = useBoolean()

  const onWalletClick = useCallback((wallet: Wallet) => {
    router.push(`/wallet/${wallet.address}`)
  }, [router])

  const CreateButton =
    <OppositeTextButton className="text-lg md:text-xl" onClick={creator.enable}>
      Add wallet
    </OppositeTextButton>

  const WalletsList = <div className="flex flex-col gap-2 overflow-y-auto">
    {wallets.data?.map(wallet =>
      <ClickableWalletRow
        key={wallet.address}
        wallet={wallet}
        ok={onWalletClick} />)}
  </div>

  const Body = <>
    {WalletsList}
    <div className="grow" />
    <div className="h-1" />
    {CreateButton}
    <div className="h-1" />
  </>

  return <main className="h-full flex flex-col">
    {creator.current &&
      <WalletCreatorDialog
        close={creator.disable} />}
    <span className="p-md text-center text-2xl font-bold">
      My wallets
    </span>
    <div className="h-4" />
    {Body}
  </main>
}

export function ClickableWalletRow(props: WalletProps & OkProps<Wallet>) {
  const { ok, wallet } = props

  const onClick = useCallback(() => {
    ok(wallet)
  }, [ok, wallet])

  return <div className="cursor-pointer"
    onClick={onClick}>
    <WalletRow wallet={wallet} />
  </div>
}
