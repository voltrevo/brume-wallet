/* eslint-disable @next/next/no-img-element */
import { Outline } from "@/libs/icons/icons"
import { useBooleanHandle } from "@/libs/react/handles/boolean"
import { OkProps, OptionalOkProps } from "@/libs/react/props/promise"
import { useBackground } from "@/mods/foreground/background/context"
import { Path } from "@/mods/foreground/router/path"
import { useCallback } from "react"
import { Wallet, WalletProps, useWallet } from "../data"
import { WalletCard } from "../row"
import { WalletCreatorDialog } from "./create"
import { useWallets } from "./data"

export function defaultOk(wallet: Wallet) {
  Path.go(`/wallet/${wallet.uuid}`)
}

export function WalletsPage(props: OptionalOkProps<Wallet>) {
  const { ok = defaultOk } = props

  const background = useBackground()
  const wallets = useWallets(background)

  const creator = useBooleanHandle(false)

  const onWalletClick = useCallback((wallet: Wallet) => {
    ok(wallet)
  }, [ok])

  const WalletsList =
    <div className="grid grid-rows-auto-fill gap-2">
      {wallets.data?.inner.map(wallet =>
        <ClickableWalletRow
          key={wallet.uuid}
          wallet={wallet}
          ok={onWalletClick} />)}
      <NewWalletRow ok={creator.enable} />
    </div>

  const Body =
    <div className="p-xmd flex flex-col grow">
      <div className="">
        <div className="text-lg font-medium">
          Total balance
        </div>
        <div className="text-2xl font-bold">
          $???
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
  const { ok } = props

  const background = useBackground()
  const wallet = useWallet(props.wallet.uuid, background)

  const onClick = useCallback(() => {
    ok(props.wallet)
  }, [ok, props.wallet])

  if (wallet.data === undefined)
    return null

  return <button className="w-full ahover:scale-105 transition-transform"
    onMouseDown={onClick}>
    <WalletCard wallet={wallet.data.inner} />
  </button>
}

export function NewWalletRow(props: OkProps<unknown>) {
  const { ok } = props

  return <button className="p-md w-full aspect-video rounded-xl flex gap-2 justify-center items-center border border-contrast border-dashed ahover:scale-105 transition-transform"
    onClick={ok}>
    <Outline.PlusIcon className="icon-sm" />
    <div className="font-medium">
      New wallet
    </div>
  </button>
}
