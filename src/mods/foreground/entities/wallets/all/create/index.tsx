import { Outline } from "@/libs/icons/icons";
import { Button } from "@/libs/ui/button";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { useCallback, useState } from "react";
import { ReadonlyWalletCreatorDialog } from "./readonly";
import { StandaloneWalletCreatorDialog } from "./standalone";

export function WalletCreatorDialog(props: {}) {
  const close = useCloseContext().unwrap()

  const [type, setType] = useState<"readonly" | "privateKey">()

  const onWatchonlyClick = useCallback(() => {
    setType("readonly")
  }, [])

  const onPrivateKeyClick = useCallback(() => {
    setType("privateKey")
  }, [])

  const onClose = useCallback(() => {
    setType(undefined)
  }, [])


  return <>
    {type === "readonly" &&
      <Dialog
        close={onClose}>
        <ReadonlyWalletCreatorDialog />
      </Dialog>}
    {type === "privateKey" &&
      <Dialog
        close={onClose}>
        <StandaloneWalletCreatorDialog />
      </Dialog>}
    <Dialog.Title>
      New wallet
    </Dialog.Title>
    <div className="h-4" />
    <div className="w-full flex items-center gap-2">
      <Button.Contrast className="flex-1 whitespace-nowrap p-4 rounded-xl"
        onClick={onWatchonlyClick}>
        <div className={`${Button.Shrinker.className} flex-col`}>
          <Outline.EyeIcon className="size-6" />
          <span>Watch-only</span>
        </div>
      </Button.Contrast>
      <Button.Contrast className="flex-1 whitespace-nowrap p-4 rounded-xl"
        onClick={onPrivateKeyClick}>
        <div className={`${Button.Shrinker.className} flex-col`}>
          <Outline.WalletIcon className="size-6" />
          <span>Private key</span>
        </div>
      </Button.Contrast>
    </div>
  </>
}
