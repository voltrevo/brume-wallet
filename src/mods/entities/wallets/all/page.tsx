/* eslint-disable @next/next/no-img-element */
import { Outline } from "@/libs/icons/icons"
import { useBooleanState } from "@/libs/react/handles/boolean"
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
  const creator = useBooleanState()

  const onWalletClick = useCallback((wallet: Wallet) => {
    router.push(`/wallet/${wallet.uuid}`)
  }, [router])

  const WalletsList =
    <div className="flex flex-col gap-2">
      {!wallets.data?.length &&
        <ContainedButton className="w-full text-lg"
          icon={Outline.PlusIcon}
          onClick={creator.enable}>
          New wallet
        </ContainedButton>}
      {wallets.data?.map(wallet =>
        <ClickableWalletRow
          key={wallet.uuid}
          wallet={wallet}
          ok={onWalletClick} />)}
    </div>

  const Body =
    <div className="p-xmd flex flex-col grow">
      <div className="">
        <div className="text-lg font-medium">
          Total balance
        </div>
        <div className="text-2xl font-bold">
          $0
        </div>
      </div>
      <div className="h-8" />
      {WalletsList}
    </div>

  const Header =
    <div className="p-xmd flex items-center">
      <div className="text-2xl font-medium">
        Wallets
      </div>
      <div className="grow" />
      <button className="rounded-full icon-xl flex justify-center items-center border border-contrast"
        onClick={creator.enable}>
        <Outline.PlusIcon className="icon-sm" />
      </button>
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
