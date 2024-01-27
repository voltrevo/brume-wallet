import { Outline } from "@/libs/icons/icons";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { useCallback, useState } from "react";
import { WideShrinkableContrastButton, WideShrinkableOppositeButton } from "../../actions/send";
import { ReadonlyWalletCreatorDialog } from "./readonly";
import { EmptyWalletCard, StandaloneWalletCreatorDialog } from "./standalone";

export function WalletCreatorDialog(props: {}) {
  const [type, setType] = useState<"readonly" | "privateKey">()

  const onWatchonlyClick = useCallback(() => {
    setType("readonly")
  }, [])

  const onPrivateKeyClick = useCallback(() => {
    setType("privateKey")
  }, [])

  return <>
    {type === "readonly" &&
      <ReadonlyWalletCreatorDialog />}
    {type === "privateKey" &&
      <StandaloneWalletCreatorDialog />}
    {type == null && <>
      <Dialog.Title>
        New wallet
      </Dialog.Title>
      <div className="h-4" />
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          <EmptyWalletCard />
        </div>
      </div>
      <div className="h-2" />
      <div className="flex-1 flex flex-col">
        <div className="grow" />
        <div className="h-4" />
        <div className="flex items-center flex-wrap-reverse gap-2">
          <WideShrinkableContrastButton
            onClick={onWatchonlyClick}>
            <Outline.EyeIcon className="size-5" />
            <span>Watch-only</span>
          </WideShrinkableContrastButton>
          <WideShrinkableOppositeButton
            onClick={onPrivateKeyClick}>
            <Outline.WalletIcon className="size-5" />
            <span>Private key</span>
          </WideShrinkableOppositeButton>
        </div>
      </div>
    </>}
  </>
}
