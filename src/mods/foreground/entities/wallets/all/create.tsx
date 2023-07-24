import { Outline } from "@/libs/icons/icons";
import { CloseProps } from "@/libs/react/props/close";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
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

  return <Dialog close={close}>
    {type === "readonly" &&
      <ReadonlyWalletCreatorDialog
        close={close} />}
    {type === "privateKey" &&
      <PrivateKeyWalletCreatorDialog
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
            <Outline.EyeIcon className="s-md" />
            <span>Watch-only</span>
          </Button.Shrink>
        </Button.Contrast>
        <Button.Contrast className="grow p-4 rounded-xl"
          onClick={onPrivateKeyClick}>
          <Button.Shrink className="flex flex-col">
            <Outline.WalletIcon className="s-md" />
            <span>Private key</span>
          </Button.Shrink>
        </Button.Contrast>
      </div>
    </>}
  </Dialog>
}
