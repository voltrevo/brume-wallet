/* eslint-disable @next/next/no-img-element */
import { UUIDProps } from "@/libs/react/props/uuid";
import { Dialog2 } from "@/libs/ui/dialog/dialog";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useCallback } from "react";
import { PageBody, UserPageHeader } from "../../../../libs/ui2/page/header";
import { Page } from "../../../../libs/ui2/page/page";
import { HashSubpathProvider, useHashSubpath, usePathContext } from "../../router/path/context";
import { SeededWalletCreatorDialog } from "../wallets/all/create/seeded";
import { ClickableWalletGrid } from "../wallets/all/page";
import { useWalletsBySeed } from "../wallets/data";
import { RawSeedDataCard } from "./card";
import { SeedDataProvider, useSeedDataContext, } from "./context";

export function SeedPage(props: UUIDProps) {
  const { uuid } = props

  return <SeedDataProvider uuid={uuid}>
    <SeedDataPage />
  </SeedDataProvider>
}

function SeedDataPage() {
  const path = usePathContext().unwrap()
  const seed = useSeedDataContext().unwrap()

  const walletsQuery = useWalletsBySeed(seed.uuid)
  const maybeWallets = walletsQuery.data?.get()

  const subpath = useHashSubpath(path)

  const onBackClick = useCallback(() => {
    location.assign("#/seeds")
  }, [])

  const onWalletClick = useCallback((wallet: Wallet) => {
    location.assign(`#/wallet/${wallet.uuid}`)
  }, [])

  const Header =
    <UserPageHeader
      title="Seed"
      back={onBackClick} />

  const Card =
    <div className="p-4 flex justify-center">
      <div className="w-full max-w-sm">
        <div className="w-full aspect-video rounded-xl">
          <RawSeedDataCard />
        </div>
      </div>
    </div>

  const Body =
    <PageBody>
      <ClickableWalletGrid
        ok={onWalletClick}
        wallets={maybeWallets} />
    </PageBody>

  return <Page>
    <HashSubpathProvider>
      {subpath.url.pathname === "/create" &&
        <Dialog2>
          <SeededWalletCreatorDialog />
        </Dialog2>}
    </HashSubpathProvider>
    {Header}
    {Card}
    {Body}
  </Page>
}
