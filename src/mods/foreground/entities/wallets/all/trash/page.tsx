/* eslint-disable @next/next/no-img-element */
import { Errors } from "@/libs/errors/errors"
import { Outline } from "@/libs/icons/icons"
import { isSafariExtension } from "@/libs/platform/platform"
import { useAsyncUniqueCallback } from "@/libs/react/callback"
import { PaddedRoundedClickableNakedButton } from "@/libs/ui/button"
import { PageBody, PageHeader } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { UserGuardBody } from "@/mods/foreground/user/mods/guard"
import { useUserStorageContext } from "@/mods/foreground/user/mods/storage"
import { usePathContext } from "@hazae41/chemin"
import { useCallback } from "react"
import { FgWallet, useTrashedWallets } from "../../data"
import { ClickableWalletGrid } from "../page"

export function TrashedWalletsPage() {
  const storage = useUserStorageContext().getOrThrow()

  const walletsQuery = useTrashedWallets()
  const maybeWallets = walletsQuery.current?.getOrNull()

  const trashAllOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (!isSafariExtension() && confirm("Are you sure you want to delete all wallets in the trash?") === false)
      return

    for (const wallet of maybeWallets ?? [])
      await FgWallet.schema(wallet.uuid, storage)?.deleteOrThrow()

    return
  }), [maybeWallets, storage])

  return <UserPage>
    <PageHeader title="Trash">
      <PaddedRoundedClickableNakedButton
        disabled={trashAllOrAlert.loading}
        onClick={trashAllOrAlert.run}>
        <Outline.TrashIcon className="size-5" />
      </PaddedRoundedClickableNakedButton>
    </PageHeader>
    <div className="po-2 flex items-center">
      <div className="text-default-contrast">
        {`Wallets in the trash are automatically deleted after 30 days.`}
      </div>
    </div>
    <UserGuardBody>
      <TrashedWalletsBody />
    </UserGuardBody>
  </UserPage>
}

export function TrashedWalletsBody() {
  const path = usePathContext().getOrThrow()

  const walletsQuery = useTrashedWallets()
  const maybeWallets = walletsQuery.current?.getOrNull()

  const onWalletClick = useCallback((wallet: Wallet) => {
    location.assign(path.go(`/wallet/${wallet.uuid}`))
  }, [path])

  return <PageBody>
    <ClickableWalletGrid
      disableNew
      ok={onWalletClick}
      wallets={maybeWallets} />
  </PageBody>
}