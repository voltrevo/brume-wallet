/* eslint-disable @next/next/no-img-element */
import { Outline } from "@/libs/icons/icons"
import { useBooleanHandle } from "@/libs/react/handles/boolean"
import { CreateProps } from "@/libs/react/props/create"
import { OkProps } from "@/libs/react/props/promise"
import { Button } from "@/libs/ui/button"
import { Dialog } from "@/libs/ui/dialog/dialog"
import { PageBody, UserPageHeader } from "@/libs/ui2/page/header"
import { Page } from "@/libs/ui2/page/page"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { usePathContext } from "@/mods/foreground/router/path/context"
import { Nullable } from "@hazae41/option"
import { useCallback } from "react"
import { RawWalletDataCard } from "../card"
import { WalletDataProvider, useWalletDataContext } from "../context"
import { WalletProps, useWallets } from "../data"
import { WalletCreatorDialog } from "./create"

export function WalletsPage() {
  const path = usePathContext().unwrap()
  const walletsQuery = useWallets()
  const maybeWallets = walletsQuery.data?.get()

  const creator = useBooleanHandle(false)

  const onWalletClick = useCallback((wallet: Wallet) => {
    location.assign(path.go(`/wallet/${wallet.uuid}`).href)
  }, [path])

  const Body =
    <PageBody>
      <ClickableWalletGrid
        ok={onWalletClick}
        create={creator.enable}
        wallets={maybeWallets} />
    </PageBody>

  const Header = <>
    <UserPageHeader title="Wallets">
      <Button.Base className="size-8 hovered-or-clicked-or-focused:scale-105 !transition"
        onClick={creator.enable}>
        <div className={`${Button.Shrinker.className}`}>
          <Outline.PlusIcon className="size-5" />
        </div>
      </Button.Base>
    </UserPageHeader>
    <div className="po-md flex items-center">
      <div className="text-contrast">
        {`Wallets allow you to hold funds and generate signatures. You can import wallets from a private key or generate them from a seed.`}
      </div>
    </div>
  </>

  return <Page>
    {creator.current &&
      <Dialog
        close={creator.disable}>
        <WalletCreatorDialog />
      </Dialog>}
    {Header}
    {Body}
  </Page>
}

export function ClickableWalletGrid(props: OkProps<Wallet> & CreateProps & { wallets?: Wallet[] } & { selected?: Wallet }) {
  const { wallets, ok, create } = props

  return <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
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

  return <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
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
      <RawWalletDataCard index={index} />
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
    <RawWalletDataCard />
  </div>

}

export function NewWalletCard(props: OkProps<unknown>) {
  const { ok } = props

  return <button className="po-md w-full aspect-video rounded-xl flex gap-2 justify-center items-center border border-contrast border-dashed hovered-or-clicked-or-focused:scale-105 !transition-transform"
    onClick={ok}>
    <Outline.PlusIcon className="size-5" />
    <div className="font-medium">
      New wallet
    </div>
  </button>
}
