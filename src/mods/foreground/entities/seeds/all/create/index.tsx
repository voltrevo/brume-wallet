import { Outline } from "@/libs/icons/icons";
import { CloseProps } from "@/libs/react/props/close";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { useCallback, useState } from "react";
import { LedgerSeedCreatorDialog } from "./ledger";
import { StandaloneSeedCreatorDialog } from "./standalone";

export function SeedCreatorDialog(props: CloseProps) {
  const { close } = props

  const [type, setType] = useState<"mnemonic" | "ledger">()

  const onLedgerClick = useCallback(() => {
    setType("ledger")
  }, [])

  const onMnemonicClick = useCallback(() => {
    setType("mnemonic")
  }, [])

  return <Dialog close={close}>
    {type === "mnemonic" &&
      <StandaloneSeedCreatorDialog
        close={close} />}
    {type === "ledger" &&
      <LedgerSeedCreatorDialog
        close={close} />}
    {type == null && <>
      <Dialog.Title close={close}>
        New seed
      </Dialog.Title>
      <div className="h-2" />
      <div className="w-full flex items-center gap-2">
        <Button.Contrast className="flex-1 whitespace-nowrap p-4 rounded-xl"
          onClick={onMnemonicClick}>
          <Button.Shrink className="flex flex-col">
            <Outline.DocumentTextIcon className="s-md" />
            <span>Mnemonic phrase</span>
          </Button.Shrink>
        </Button.Contrast>
        <Button.Contrast className="flex-1 whitespace-nowrap p-4 rounded-xl"
          onClick={onLedgerClick}>
          <Button.Shrink className="flex flex-col">
            <Outline.SwatchIcon className="s-md" />
            <span>Ledger</span>
          </Button.Shrink>
        </Button.Contrast>
      </div>
    </>}
  </Dialog>
}
