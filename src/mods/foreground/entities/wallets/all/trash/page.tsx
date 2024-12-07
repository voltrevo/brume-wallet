/* eslint-disable @next/next/no-img-element */
import { Errors } from "@/libs/errors/errors"
import { Outline } from "@/libs/icons/icons"
import { isSafariExtension } from "@/libs/platform/platform"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { PaddedRoundedShrinkableNakedButton } from "@/libs/ui/button"
import { PageBody, UserPageHeader } from "@/libs/ui/page/header"
import { Page } from "@/libs/ui/page/page"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { useUserStorageContext } from "@/mods/foreground/user/mods/storage"
import { usePathContext } from "@hazae41/chemin"
import { useCallback } from "react"
import { FgWallet, useTrashedWallets } from "../../data"
import { ClickableWalletGrid } from "../page"

export function TrashedWalletsPage() {
  const path = usePathContext().getOrThrow()
  const storage = useUserStorageContext().getOrThrow()

  const walletsQuery = useTrashedWallets()
  const maybeWallets = walletsQuery.current?.getOrNull()

  const onWalletClick = useCallback((wallet: Wallet) => {
    location.assign(path.go(`/wallet/${wallet.uuid}`))
  }, [path])

  const trashAllOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (!isSafariExtension() && confirm("Are you sure you want to delete all wallets in the trash?") === false)
      return

    for (const wallet of maybeWallets ?? [])
      await FgWallet.schema(wallet.uuid, storage)?.deleteOrThrow()

    return
  }), [maybeWallets, storage])

  const Body =
    <PageBody>
      <ClickableWalletGrid
        disableNew
        ok={onWalletClick}
        wallets={maybeWallets} />
    </PageBody>

  const Header = <>
    <UserPageHeader title="Trash">
      <PaddedRoundedShrinkableNakedButton
        disabled={trashAllOrAlert.loading}
        onClick={trashAllOrAlert.run}>
        <Outline.TrashIcon className="size-5" />
      </PaddedRoundedShrinkableNakedButton>
    </UserPageHeader>
    <div className="po-md flex items-center">
      <div className="text-contrast">
        {`Wallets in the trash are automatically deleted after 30 days.`}
      </div>
    </div>
  </>

  return <Page>
    {Header}
    {Body}
  </Page>
}



