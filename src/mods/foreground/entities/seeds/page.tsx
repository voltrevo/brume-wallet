/* eslint-disable @next/next/no-img-element */
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { UUIDProps } from "@/libs/react/props/uuid";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useCallback } from "react";
import { PageBody, UserPageHeader } from "../../../../libs/ui2/page/header";
import { Page } from "../../../../libs/ui2/page/page";
import { Paths } from "../../router/path/context";
import { SeededWalletCreatorDialog } from "../wallets/all/create/seeded";
import { ClickableWalletGrid } from "../wallets/all/page";
import { useWalletsBySeed } from "../wallets/data";
import { SeedDataCard } from "./card";
import { SeedDataProvider, useSeedDataContext, } from "./context";

export function SeedPage(props: UUIDProps) {
  const { uuid } = props

  return <SeedDataProvider uuid={uuid}>
    <SeedDataPage />
  </SeedDataProvider>
}

function SeedDataPage() {
  const seed = useSeedDataContext()

  const walletsQuery = useWalletsBySeed(seed.uuid)
  const maybeWallets = walletsQuery.data?.get()

  const creator = useBooleanHandle(false)

  const onBackClick = useCallback(() => {
    Paths.go("/seeds")
  }, [])

  const onWalletClick = useCallback((wallet: Wallet) => {
    Paths.go(`/wallet/${wallet.uuid}`)
  }, [])

  const Header =
    <UserPageHeader
      title="Seed"
      back={onBackClick} />

  const Card =
    <div className="p-4 flex justify-center">
      <div className="w-full max-w-sm">
        <SeedDataCard />
      </div>
    </div>

  const Body =
    <PageBody>
      <ClickableWalletGrid
        ok={onWalletClick}
        create={creator.enable}
        wallets={maybeWallets} />
    </PageBody>

  return <Page>
    {creator.current &&
      <Dialog
        close={creator.disable}>
        <SeededWalletCreatorDialog />
      </Dialog>}
    {Header}
    {Card}
    {Body}
  </Page>
}
