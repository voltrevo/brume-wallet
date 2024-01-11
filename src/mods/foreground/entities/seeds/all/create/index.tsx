import { Outline } from "@/libs/icons/icons";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { usePathContext } from "@/mods/foreground/router/path/context";
import { Ok, Result } from "@hazae41/result";
import { useCallback, useState } from "react";
import { LedgerSeedCreatorDialog } from "./ledger";
import { StandaloneSeedCreatorDialog } from "./standalone";

export function SeedCreatorDialog(props: {}) {
  const close = useCloseContext().unwrap()
  const { url } = usePathContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const [type, setType] = useState<"mnemonic" | "ledger">()

  const onLedgerClick = useCallback(async () => {
    return Result.unthrow<Result<void, Error>>(async t => {
      if (location.pathname !== "/" && location.pathname !== "/index.html") {
        await background.tryRequest({
          method: "brume_open",
          params: [url.pathname]
        }).then(r => r.throw(t).throw(t))

        return Ok.void()
      }

      setType("ledger")
      return Ok.void()
    }).then(Results.logAndAlert)
  }, [url, background])

  const onMnemonicClick = useCallback(() => {
    setType("mnemonic")
  }, [])

  const onClose = useCallback(() => {
    setType(undefined)
  }, [])

  return <>
    {type === "mnemonic" &&
      <Dialog
        close={onClose}>
        <StandaloneSeedCreatorDialog />
      </Dialog>}
    {type === "ledger" &&
      <Dialog
        close={onClose}>
        <LedgerSeedCreatorDialog />
      </Dialog>}
    <Dialog.Title close={close}>
      New seed
    </Dialog.Title>
    <div className="h-2" />
    <div className="w-full flex items-center gap-2">
      <Button.Contrast className="flex-1 whitespace-nowrap p-4 rounded-xl"
        onClick={onMnemonicClick}>
        <div className={`${Button.Shrinker.className} flex-col`}>
          <Outline.DocumentTextIcon className="size-6" />
          <span>Mnemonic phrase</span>
        </div>
      </Button.Contrast>
      <Button.Contrast className="flex-1 whitespace-nowrap p-4 rounded-xl"
        onClick={onLedgerClick}>
        <div className={`${Button.Shrinker.className} flex-col`}>
          <Outline.SwatchIcon className="size-6" />
          <span>Ledger</span>
        </div>
      </Button.Contrast>
    </div>
  </>
}
