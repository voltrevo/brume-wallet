/* eslint-disable @next/next/no-img-element */
import { Errors } from "@/libs/errors/errors"
import { Outline } from "@/libs/icons/icons"
import { isSafariExtension } from "@/libs/platform/platform"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { PageBody, UserPageHeader } from "@/libs/ui2/page/header"
import { Page } from "@/libs/ui2/page/page"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { usePathContext } from "@/mods/foreground/router/path/context"
import { useUserStorageContext } from "@/mods/foreground/storage/user"
import { useCallback } from "react"
import { PaddedRoundedShrinkableNakedButton } from "../../actions/send"
import { FgWallet, useTrashedWallets } from "../../data"
import { ClickableWalletGrid } from "../page"

export function TrashedWalletsPage() {
  const path = usePathContext().unwrap()
  const storage = useUserStorageContext().unwrap()

  const walletsQuery = useTrashedWallets()
  const maybeWallets = walletsQuery.current?.ok().get()

  const onWalletClick = useCallback((wallet: Wallet) => {
    location.assign(path.go(`/wallet/${wallet.uuid}`))
  }, [path])

  const trashAllOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    if (!isSafariExtension() && confirm("Are you sure you want to delete all wallets in the trash?") === false)
      return

    for (const wallet of maybeWallets ?? [])
      await FgWallet.schema(wallet.uuid, storage)?.delete()

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



