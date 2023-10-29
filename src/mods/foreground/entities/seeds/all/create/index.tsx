import { Outline } from "@/libs/icons/icons";
import { CloseProps } from "@/libs/react/props/close";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { useBackground } from "@/mods/foreground/background/context";
import { usePath } from "@/mods/foreground/router/path/context";
import { Ok, Result } from "@hazae41/result";
import { useCallback, useState } from "react";
import { LedgerSeedCreatorDialog } from "./ledger";
import { StandaloneSeedCreatorDialog } from "./standalone";

export function SeedCreatorDialog(props: CloseProps) {
  const { close } = props
  const path = usePath()
  const background = useBackground().unwrap()

  const [type, setType] = useState<"mnemonic" | "ledger">()

  const onLedgerClick = useCallback(async () => {
    return Result.unthrow<Result<void, Error>>(async t => {
      if (location.pathname !== "/" && location.pathname !== "/index.html") {
        await background.tryRequest({
          method: "brume_open",
          params: [path.pathname]
        }).then(r => r.throw(t).throw(t))

        return Ok.void()
      }

      setType("ledger")
      return Ok.void()
    }).then(Results.logAndAlert)
  }, [path, background])

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
          <div className={`${Button.Shrinker.className} flex-col`}>
            <Outline.DocumentTextIcon className="s-md" />
            <span>Mnemonic phrase</span>
          </div>
        </Button.Contrast>
        <Button.Contrast className="flex-1 whitespace-nowrap p-4 rounded-xl"
          onClick={onLedgerClick}>
          <div className={`${Button.Shrinker.className} flex-col`}>
            <Outline.SwatchIcon className="s-md" />
            <span>Ledger</span>
          </div>
        </Button.Contrast>
      </div>
    </>}
  </Dialog>
}
