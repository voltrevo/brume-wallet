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
import { useCallback, useEffect } from "react"
import { WalletDataCard } from "../card"
import { WalletDataProvider, useWalletDataContext } from "../context"
import { useTotalPricedBalance } from "../data"
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
        maybeWallets={maybeWallets} />
    </PageBody>

  const Header =
    <PageHeader title="Wallets">
      <Button.Base className="s-xl hovered-or-clicked-or-focused:scale-105 transition"
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

export function ClickableWalletGrid(props: OkProps<Wallet> & CreateProps & { maybeWallets?: Wallet[] }) {
  const { maybeWallets, ok, create } = props

  return <div className="grid grow place-content-start place-items-center gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {maybeWallets?.map(wallet =>
      <WalletDataProvider
        key={wallet.uuid}
        uuid={wallet.uuid}>
        <ClickableWalletDataCard ok={ok} />
      </WalletDataProvider>)}
    <NewWalletCard ok={create} />
  </div>
}

export function ClickableWalletDataCard(props: OkProps<Wallet>) {
  const wallet = useWalletDataContext()
  const { ok } = props

  const onClick = useCallback(() => {
    ok(wallet)
  }, [ok, wallet])

  return <button className="w-full hovered-or-clicked-or-focused:scale-105 transition-transform"
    onClick={onClick}>
    <WalletDataCard />
  </button>
}

export function NewWalletCard(props: OkProps<unknown>) {
  const { ok } = props

  return <button className="po-md w-full aspect-video rounded-xl flex gap-2 justify-center items-center border border-contrast border-dashed hovered-or-clicked-or-focused:scale-105 transition-transform"
    onClick={ok}>
    <Outline.PlusIcon className="s-sm" />
    <div className="font-medium">
      New wallet
    </div>
  </button>
}
