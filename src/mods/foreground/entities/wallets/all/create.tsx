import { Button } from "@/libs/components/button";
import { Dialog } from "@/libs/components/dialog/dialog";
import { Outline } from "@/libs/icons/icons";
import { useAsyncReplaceMemo } from "@/libs/react/memo";
import { CloseProps } from "@/libs/react/props/close";
import { useCallback, useState } from "react";
import { PrivateKeyWalletCreatorDialog } from "./create/private";
import { ReadonlyWalletCreatorDialog } from "./create/public";

export function WalletCreatorDialog(props: CloseProps) {
  const { close } = props

  const [type, setType] = useState<"readonly" | "privateKey">()

  const onWatchonlyClick = useCallback(() => {
    setType("readonly")
  }, [])

  const onPrivateKeyClick = useCallback(() => {
    setType("privateKey")
  }, [])

  const uuid = useAsyncReplaceMemo(async () => {
    return crypto.randomUUID()
  }, [])

  return <Dialog close={close}>
    {type === "readonly" && uuid &&
      <ReadonlyWalletCreatorDialog
        uuid={uuid}
        close={close} />}
    {type === "privateKey" && uuid &&
      <PrivateKeyWalletCreatorDialog
        uuid={uuid}
        close={close} />}
    {type == null && <>
      <Dialog.Title close={close}>
        New wallet
      </Dialog.Title>
      <div className="h-2" />
      <div className="w-full flex items-center gap-2">
        <Button.Contrast className="grow p-4 rounded-xl"
          onClick={onWatchonlyClick}>
          <Button.Shrink className="flex flex-col">
            <Outline.EyeIcon className="icon-md" />
            <span>Watch-only wallet</span>
          </Button.Shrink>
        </Button.Contrast>
        <Button.Contrast className="grow p-4 rounded-xl"
          onClick={onPrivateKeyClick}>
          <Button.Shrink className="flex flex-col">
            <Outline.WalletIcon className="icon-md" />
            <span>Private key wallet</span>
          </Button.Shrink>
        </Button.Contrast>
      </div>
    </>}
  </Dialog>
}
