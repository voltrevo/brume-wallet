import { Color } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useConstant } from "@/libs/react/ref";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { useCallback, useState } from "react";
import { WideShrinkableGradientButton } from "../../actions/send";
import { ReadonlyWalletCreatorDialog } from "./readonly";
import { EmptyWalletCard, StandaloneWalletCreatorDialog } from "./standalone";

export function WalletCreatorDialog(props: {}) {
  const [type, setType] = useState<"readonly" | "privateKey">()

  const uuid = useConstant(() => crypto.randomUUID())

  const modhash = useModhash(uuid)
  const color = Color.get(modhash)
  const emoji = Emojis.get(modhash)

  const onWatchonlyClick = useCallback(() => {
    setType("readonly")
  }, [])

  const onPrivateKeyClick = useCallback(() => {
    setType("privateKey")
  }, [])

  return <>
    {type === "readonly" &&
      <ReadonlyWalletCreatorDialog
        uuid={uuid}
        color={color}
        emoji={emoji} />}
    {type === "privateKey" &&
      <StandaloneWalletCreatorDialog
        uuid={uuid}
        color={color}
        emoji={emoji} />}
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
        <div className="h-4 grow" />
        <div className="flex items-center flex-wrap-reverse gap-2">
          <WideShrinkableGradientButton
            onClick={onWatchonlyClick}
            color={color}>
            <Outline.EyeIcon className="size-5" />
            <span>Watch-only</span>
          </WideShrinkableGradientButton>
          <WideShrinkableGradientButton
            onClick={onPrivateKeyClick}
            color={color}>
            <Outline.WalletIcon className="size-5" />
            <span>Private key</span>
          </WideShrinkableGradientButton>
        </div>
      </div>
    </>}
  </>
}
