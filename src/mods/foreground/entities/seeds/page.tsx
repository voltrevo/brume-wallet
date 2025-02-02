/* eslint-disable @next/next/no-img-element */
import { UUIDProps } from "@/libs/react/props/uuid";
import { Dialog } from "@/libs/ui/dialog";
import { PageBody, PageHeader } from "@/libs/ui/page/header";
import { UserPage } from "@/libs/ui/page/page";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { HashSubpathProvider, useHashSubpath, usePathContext } from "@hazae41/chemin";
import { useCallback } from "react";
import { useLocaleContext } from "../../global/mods/locale";
import { Locale } from "../../locale";
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
  const locale = useLocaleContext().getOrThrow()
  const path = usePathContext().getOrThrow()
  const seed = useSeedDataContext().getOrThrow()

  const walletsQuery = useWalletsBySeed(seed.uuid)
  const maybeWallets = walletsQuery.data?.get()

  const hash = useHashSubpath(path)

  const onBackClick = useCallback(() => {
    location.assign("#/seeds")
  }, [])

  const onWalletClick = useCallback((wallet: Wallet) => {
    location.assign(`#/wallet/${wallet.uuid}`)
  }, [])

  const Header =
    <PageHeader title={Locale.get(Locale.Seed, locale)} />

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

  return <UserPage>
    <HashSubpathProvider>
      {hash.url.pathname === "/create" &&
        <Dialog>
          <SeededWalletCreatorDialog />
        </Dialog>}
    </HashSubpathProvider>
    {Header}
    {Card}
    {Body}
  </UserPage>
}
