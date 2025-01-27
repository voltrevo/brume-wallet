/* eslint-disable @next/next/no-img-element */
import { Outline } from "@/libs/icons/icons"
import { ChildrenProps } from "@/libs/react/props/children"
import { OkProps } from "@/libs/react/props/promise"
import { PaddedRoundedClickableNakedAnchor, WideClickableContrastAnchor } from "@/libs/ui/anchor"
import { Dialog } from "@/libs/ui/dialog"
import { Menu } from "@/libs/ui/menu"
import { PageBody, PageHeader } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { UserGuardBody } from "@/mods/foreground/user/mods/guard"
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin"
import { Nullable } from "@hazae41/option"
import { Fragment, useCallback } from "react"
import { RawWalletDataCard } from "../card"
import { WalletDataProvider } from "../context"
import { WalletProps, useTrashedWallets, useWallets } from "../data"
import { WalletCreatorMenu } from "./create"
import { ReadonlyWalletCreatorDialog } from "./create/readonly"
import { StandaloneWalletCreatorDialog } from "./create/standalone"

export function WalletsPage() {
  const path = usePathContext().getOrThrow()

  const subpath = useHashSubpath(path)
  const creator = useCoords(subpath, "/create")

  return <UserPage>
    <PageHeader title="Wallets">
      <PaddedRoundedClickableNakedAnchor
        onKeyDown={creator.onKeyDown}
        onClick={creator.onClick}
        href={creator.href}>
        <Outline.PlusIcon className="size-5" />
      </PaddedRoundedClickableNakedAnchor>
    </PageHeader>
    <div className="p-4 text-default-contrast">
      {`Wallets allow you to hold funds and generate signatures. You can import wallets from a private key or generate them from a seed.`}
    </div>
    <UserGuardBody>
      <WalletsBody />
    </UserGuardBody>
  </UserPage>
}

export function WalletsBody() {
  const path = usePathContext().getOrThrow()

  const walletsQuery = useWallets()
  const maybeWallets = walletsQuery.current?.getOrNull()

  const trashedWalletsQuery = useTrashedWallets()
  const maybeTrashedWallets = trashedWalletsQuery.current?.getOrNull()

  const subpath = useHashSubpath(path)

  const onWalletClick = useCallback((wallet: Wallet) => {
    location.assign(path.go(`/wallet/${wallet.uuid}`))
  }, [path])

  return <PageBody>
    <HashSubpathProvider>
      {subpath.url.pathname === "/create" &&
        <Menu>
          <WalletCreatorMenu />
        </Menu>}
      {subpath.url.pathname === "/create/standalone" &&
        <Dialog>
          <StandaloneWalletCreatorDialog />
        </Dialog>}
      {subpath.url.pathname === "/create/readonly" &&
        <Dialog>
          <ReadonlyWalletCreatorDialog />
        </Dialog>}
    </HashSubpathProvider>
    <ClickableWalletGrid
      ok={onWalletClick}
      wallets={maybeWallets} />
    <div className="h-4" />
    {maybeTrashedWallets != null && maybeTrashedWallets.length > 0 &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableContrastAnchor
          href="#/wallets/trash">
          <Outline.TrashIcon className="size-5" />
          Trash ({maybeTrashedWallets.length})
        </WideClickableContrastAnchor>
      </div>}
  </PageBody>
}

export function ClickableWalletGrid(props: OkProps<Wallet> & { wallets: Nullable<Wallet[]> } & { selected?: Wallet } & { disableNew?: boolean }) {
  const { wallets, ok, disableNew } = props

  return <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {wallets?.map(wallet =>
      <Fragment key={wallet.uuid}>
        <ClickableWalletCard
          wallet={wallet}
          ok={ok} />
      </Fragment>)}
    {!disableNew &&
      <NewRectangularAnchorCard>
        New wallet
      </NewRectangularAnchorCard>}
  </div>
}

export function SelectableWalletGrid(props: OkProps<Wallet> & { wallets: Nullable<Wallet[]> } & { selecteds: Nullable<Wallet>[] } & { disableNew?: boolean }) {
  const { wallets, ok, selecteds, disableNew } = props

  return <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {wallets?.map(wallet =>
      <Fragment key={wallet.uuid}>
        <CheckableWalletCard
          wallet={wallet}
          index={selecteds.indexOf(wallet)}
          ok={ok} />
      </Fragment>)}
    {!disableNew &&
      <NewRectangularAnchorCard>
        New wallet
      </NewRectangularAnchorCard>}
  </div>
}

export function CheckableWalletCard(props: WalletProps & OkProps<Wallet> & { index: number }) {
  const { wallet, ok, index } = props
  const checked = index !== -1

  const onClick = useCallback(() => {
    ok(wallet)
  }, [ok, wallet])

  return <div className={`w-full aspect-video rounded-xl overflow-hidden cursor-pointer aria-checked:outline aria-checked:outline-2 aria-checked:outline-blue-600 animate-vibrate-loop`}
    role="checkbox"
    aria-checked={checked}
    onClick={onClick}>
    <WalletDataProvider uuid={wallet.uuid}>
      <RawWalletDataCard index={index} />
    </WalletDataProvider>
  </div>
}

export function ClickableWalletCard(props: WalletProps & OkProps<Wallet>) {
  const { wallet, ok } = props

  const onClick = useCallback(() => {
    ok(wallet)
  }, [ok, wallet])

  return <div className={`w-full aspect-video rounded-xl overflow-hidden cursor-pointer hovered-or-clicked-or-focused:scale-105 !transition-transform`}
    role="button"
    onClick={onClick}>
    <WalletDataProvider uuid={wallet.uuid}>
      <RawWalletDataCard />
    </WalletDataProvider>
  </div>

}

export function NewRectangularAnchorCard(props: ChildrenProps) {
  const path = usePathContext().getOrThrow()
  const { children } = props

  const subpath = useHashSubpath(path)
  const creator = useCoords(subpath, "/create")

  return <a className="po-2 w-full aspect-video rounded-xl flex gap-2 justify-center items-center border border-default-contrast border-dashed active:scale-90 transition-transform"
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
