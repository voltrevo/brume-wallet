/* eslint-disable @next/next/no-img-element */
import { Outline } from "@/libs/icons/icons"
import { useBooleanHandle } from "@/libs/react/handles/boolean"
import { OkProps, OptionalOkProps } from "@/libs/react/props/promise"
import { OptionalTitleProps } from "@/libs/react/props/title"
import { useBackground } from "@/mods/foreground/background/context"
import { PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { Path } from "@/mods/foreground/router/path"
import { useCallback } from "react"
import { Wallet, WalletProps, useWallet } from "../data"
import { WalletCard } from "../row"
import { WalletCreatorDialog } from "./create"
import { useWallets } from "./data"

function go(wallet: Wallet) {
  Path.go(`/wallet/${wallet.uuid}`)
}

export function WalletsPage(props: OptionalTitleProps & OptionalOkProps<Wallet> & { showBalance?: boolean }) {
  const { title = "Wallets", ok = go, showBalance = true } = props

  const background = useBackground()
  const wallets = useWallets(background)

  const creator = useBooleanHandle(false)

  const onWalletClick = useCallback((wallet: Wallet) => {
    ok(wallet)
  }, [ok])

  const WalletsList =
    <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
      {wallets.data?.inner.map(wallet =>
        <ClickableWalletRow
          key={wallet.uuid}
          wallet={wallet}
          ok={onWalletClick} />)}
      <NewWalletRow ok={creator.enable} />
    </div>

  const Body =
    <div className="p-xmd flex flex-col grow">
      {showBalance &&
        <div className="mb-8">
          <div className="text-lg font-medium">
            Total balance
          </div>
          <div className="text-2xl font-bold">
            $???
          </div>
        </div>}
      {WalletsList}
    </div>

  const Header =
    <PageHeader title={title}>
      <button className="rounded-full icon-xl flex justify-center items-center border border-contrast"
        onClick={creator.enable}>
        <Outline.PlusIcon className="icon-sm" />
      </button>
    </PageHeader>

  return <Page>
    {creator.current &&
      <WalletCreatorDialog
        close={creator.disable} />}
    {Header}
    {Body}
  </Page>
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
