/* eslint-disable @next/next/no-img-element */
import { Outline } from "@/libs/icons/icons"
import { useBooleanHandle } from "@/libs/react/handles/boolean"
import { CreateProps } from "@/libs/react/props/create"
import { OkProps } from "@/libs/react/props/promise"
import { Button } from "@/libs/ui/button"
import { Dialog } from "@/libs/ui/dialog/dialog"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { useBackgroundContext } from "@/mods/foreground/background/context"
import { PageBody, PageHeader } from "@/mods/foreground/components/page/header"
import { Page } from "@/mods/foreground/components/page/page"
import { Path } from "@/mods/foreground/router/path/context"
import { Nullable } from "@hazae41/option"
import { useCallback, useEffect } from "react"
import { WalletDataCard } from "../card"
import { WalletDataProvider, useWalletDataContext } from "../context"
import { WalletProps, useTotalPricedBalance } from "../data"
import { useDisplayUsd } from "../page"
import { WalletCreatorDialog } from "./create"
import { useWallets } from "./data"

export function WalletsPage() {
  const background = useBackgroundContext().unwrap()

  const walletsQuery = useWallets()
  const maybeWallets = walletsQuery.data?.inner

  const creator = useBooleanHandle(false)

  const totalPricedBalanceQuery = useTotalPricedBalance("usd")
  const totalPricedBalanceDisplay = useDisplayUsd(totalPricedBalanceQuery.current)

  useEffect(() => {
    background.tryRequest({ method: "brume_log" }).then(r => r.inspectErrSync(console.warn))
  }, [background])

  const onWalletClick = useCallback((wallet: Wallet) => {
    Path.go(`/wallet/${wallet.uuid}`)
  }, [])

  const Body =
    <PageBody>
      <div className="text-lg font-medium">
        Total balance
      </div>
      <div className="text-2xl font-bold">
        {totalPricedBalanceDisplay}
      </div>
      <div className="h-8" />
      <ClickableWalletGrid
        ok={onWalletClick}
        create={creator.enable}
        wallets={maybeWallets} />
    </PageBody>

  const Header =
    <PageHeader title="Wallets">
      <Button.Base className="s-xl hovered-or-clicked-or-focused:scale-105 !transition"
        onClick={creator.enable}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.PlusIcon className="s-sm" />
        </div>
      </Button.Base>
    </PageHeader>

  return <Page>
    <Dialog
      opened={creator.current}
      close={creator.disable}>
      <WalletCreatorDialog />
    </Dialog>
    {Header}
    {Body}
  </Page>
}

export function ClickableWalletGrid(props: OkProps<Wallet> & CreateProps & { wallets?: Wallet[] } & { selected?: Wallet }) {
  const { wallets, ok, create } = props

  return <div className="grid grow place-content-start place-items-center gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {wallets?.map(wallet =>
      <WalletDataProvider
        key={wallet.uuid}
        uuid={wallet.uuid}>
        <ClickableWalletDataCard ok={ok} />
      </WalletDataProvider>)}
    <NewWalletCard ok={create} />
  </div>
}

export function SelectableWalletGrid(props: OkProps<Wallet> & CreateProps & { wallets?: Wallet[] } & { selecteds: Nullable<Wallet>[] }) {
  const { wallets, ok, create, selecteds } = props

  return <div className="grid grow place-content-start place-items-center gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {wallets?.map(wallet =>
      <CheckableWalletDataCard
        key={wallet.uuid}
        wallet={wallet}
        index={selecteds.indexOf(wallet)}
        ok={ok} />)}
    <NewWalletCard ok={create} />
  </div>
}

export function CheckableWalletDataCard(props: WalletProps & OkProps<Wallet> & { index: number }) {
  const { wallet, ok, index } = props
  const checked = index !== -1

  const onClick = useCallback(() => {
    ok(wallet)
  }, [ok, wallet])

  return <div className={`w-full aspect-video rounded-xl overflow-hidden cursor-pointer aria-checked:outline aria-checked:outline-2 aria-checked:outline-blue-600 animate-vibrate-loop`}
    role="checkbox"
    aria-checked={checked}
    onClick={onClick}>
    <WalletDataProvider
      uuid={wallet.uuid}>
      <WalletDataCard index={index} />
    </WalletDataProvider>
  </div>
}

export function ClickableWalletDataCard(props: OkProps<Wallet>) {
  const wallet = useWalletDataContext().unwrap()
  const { ok } = props

  const onClick = useCallback(() => {
    ok(wallet)
  }, [ok, wallet])

  return <div className={`w-full aspect-video rounded-xl overflow-hidden cursor-pointer hovered-or-clicked-or-focused:scale-105 !transition-transform`}
    role="button"
    onClick={onClick}>
    <WalletDataCard />
  </div>

}

export function NewWalletCard(props: OkProps<unknown>) {
  const { ok } = props

  return <button className="po-md w-full aspect-video rounded-xl flex gap-2 justify-center items-center border border-contrast border-dashed hovered-or-clicked-or-focused:scale-105 !transition-transform"
    onClick={ok}>
    <Outline.PlusIcon className="s-sm" />
    <div className="font-medium">
      New wallet
    </div>
  </button>
}
