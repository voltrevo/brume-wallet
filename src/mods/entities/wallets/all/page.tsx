/* eslint-disable @next/next/no-img-element */
import { Outline } from "@/libs/icons/icons"
import { useBoolean } from "@/libs/react/handles/boolean"
import { OkProps } from "@/libs/react/props/promise"
import { ContainedButton } from "@/mods/components/buttons/button"
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
    <ContainedButton className="w-full text-lg"
      icon={Outline.PlusIcon}
      onClick={creator.enable}>
      New wallet
    </ContainedButton>

  const WalletsList =
    <div className="flex flex-col gap-2">
      {!wallets.data?.length &&
        <div className="p-xmd text-center text-contrast">
          {`You don't have any wallet`}
        </div>}
      {wallets.data?.map(wallet =>
        <ClickableWalletRow
          key={wallet.address}
          wallet={wallet}
          ok={onWalletClick} />)}
    </div>

  const Body =
    <div className="p-xmd flex flex-col grow">
      {WalletsList}
      <div className="h-2 grow" />
      {CreateButton}
    </div>

  const Header =
    <div className="p-xmd text-center text-xl font-medium">
      My wallets
    </div>

  return <div className="h-full w-full flex flex-col">
    {creator.current &&
      <WalletCreatorDialog
        close={creator.disable} />}
    {Header}
    {Body}
  </div>
}

export function ClickableWalletRow(props: WalletProps & OkProps<Wallet>) {
  const { ok, wallet } = props

  const onClick = useCallback(() => {
    ok(wallet)
  }, [ok, wallet])

  return <div onClick={onClick}>
    <WalletRow wallet={wallet} />
  </div>
}
