/* eslint-disable @next/next/no-img-element */
import { Outline } from "@/libs/icons/icons"
import { ChildrenProps } from "@/libs/react/props/children"
import { CreateProps } from "@/libs/react/props/create"
import { OkProps } from "@/libs/react/props/promise"
import { Dialog2 } from "@/libs/ui/dialog/dialog"
import { Menu } from "@/libs/ui2/menu/menu"
import { PageBody, UserPageHeader } from "@/libs/ui2/page/header"
import { Page } from "@/libs/ui2/page/page"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { SubpathProvider, usePathContext, useSubpath } from "@/mods/foreground/router/path/context"
import { Nullable } from "@hazae41/option"
import { useCallback } from "react"
import { WideShrinkableContrastAnchor, useGenius } from "../../users/all/page"
import { PaddedRoundedShrinkableNakedAnchor } from "../actions/send"
import { RawWalletDataCard } from "../card"
import { WalletDataProvider, useWalletDataContext } from "../context"
import { WalletProps, useTrashedWallets, useWallets } from "../data"
import { WalletCreatorMenu } from "./create"
import { ReadonlyWalletCreatorDialog } from "./create/readonly"
import { StandaloneWalletCreatorDialog } from "./create/standalone"

export function WalletsPage() {
  const path = usePathContext().unwrap()

  const walletsQuery = useWallets()
  const maybeWallets = walletsQuery.current?.ok().get()

  const trashedWalletsQuery = useTrashedWallets()
  const maybeTrashedWallets = trashedWalletsQuery.current?.ok().get()

  const subpath = useSubpath(path)
  const creator = useGenius(subpath, "/create")

  const onWalletClick = useCallback((wallet: Wallet) => {
    location.assign(path.go(`/wallet/${wallet.uuid}`).href)
  }, [path])

  const Body =
    <PageBody>
      <ClickableWalletGrid
        ok={onWalletClick}
        wallets={maybeWallets} />
      <div className="h-4" />
      {maybeTrashedWallets != null && maybeTrashedWallets.length > 0 &&
        <div className="flex items-center flex-wrap-reverse gap-2">
          <WideShrinkableContrastAnchor
            href="#/wallets/trash">
            <Outline.TrashIcon className="size-5" />
            Trash ({maybeTrashedWallets.length})
          </WideShrinkableContrastAnchor>
        </div>}
    </PageBody>

  const Header = <>
    <UserPageHeader title="Wallets">
      <PaddedRoundedShrinkableNakedAnchor
        onKeyDown={creator.onKeyDown}
        onClick={creator.onClick}
        href={creator.href}>
        <Outline.PlusIcon className="size-5" />
      </PaddedRoundedShrinkableNakedAnchor>
    </UserPageHeader>
    <div className="po-md flex items-center">
      <div className="text-contrast">
        {`Wallets allow you to hold funds and generate signatures. You can import wallets from a private key or generate them from a seed.`}
      </div>
    </div>
  </>

  return <Page>
    <SubpathProvider>
      {subpath.url.pathname === "/create" &&
        <Menu>
          <WalletCreatorMenu />
        </Menu>}
      {subpath.url.pathname === "/create/standalone" &&
        <Dialog2>
          <StandaloneWalletCreatorDialog />
        </Dialog2>}
      {subpath.url.pathname === "/create/readonly" &&
        <Dialog2>
          <ReadonlyWalletCreatorDialog />
        </Dialog2>}
    </SubpathProvider>
    {Header}
    {Body}
  </Page>
}

export function ClickableWalletGrid(props: OkProps<Wallet> & { wallets?: Wallet[] } & { selected?: Wallet } & { disableNew?: boolean }) {
  const { wallets, ok, disableNew } = props

  return <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {wallets?.map(wallet =>
      <WalletDataProvider
        key={wallet.uuid}
        uuid={wallet.uuid}>
        <ClickableWalletDataCard ok={ok} />
      </WalletDataProvider>)}
    {!disableNew &&
      <NewRectangularAnchorCard>
        New wallet
      </NewRectangularAnchorCard>}
  </div>
}

export function SelectableWalletGrid(props: OkProps<Wallet> & CreateProps & { wallets?: Wallet[] } & { selecteds: Nullable<Wallet>[] } & { disableNew?: boolean }) {
  const { wallets, ok, selecteds, disableNew } = props

  return <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {wallets?.map(wallet =>
      <CheckableWalletDataCard
        key={wallet.uuid}
        wallet={wallet}
        index={selecteds.indexOf(wallet)}
        ok={ok} />)}
    {!disableNew &&
      <NewRectangularAnchorCard>
        New wallet
      </NewRectangularAnchorCard>}
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

export function NewRectangularAnchorCard(props: ChildrenProps) {
  const path = usePathContext().unwrap()
  const { children } = props

  const subpath = useSubpath(path)
  const creator = useGenius(subpath, "/create")

  return <a className="po-md w-full aspect-video rounded-xl flex gap-2 justify-center items-center border border-contrast border-dashed active:scale-90 transition-transform"
    onContextMenu={creator.onContextMenu}
    onKeyDown={creator.onKeyDown}
    onClick={creator.onClick}
    href={creator.href}>
    <Outline.PlusIcon className="size-5" />
    <div className="font-medium">
      {children}
    </div>
  </a>
}
