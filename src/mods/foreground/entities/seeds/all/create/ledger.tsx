import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Outline } from "@/libs/icons/icons";
import { Ledger } from "@/libs/ledger";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { useConstant } from "@/libs/react/ref";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { SeedData } from "@/mods/background/service_worker/entities/seeds/data";
import { useBackground } from "@/mods/foreground/background/context";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { useDeferredValue, useMemo, useState } from "react";
import { WalletAvatar } from "../../../wallets/avatar";

export function LedgerSeedCreatorDialog(props: CloseProps) {
  const { close } = props
  const background = useBackground().unwrap()

  const uuid = useConstant(() => crypto.randomUUID())

  const modhash = useModhash(uuid)
  const color = Colors.mod(modhash)
  const emoji = Emojis.get(modhash)

  const [rawNameInput = "", setRawNameInput] = useState<string>()

  const defNameInput = useDeferredValue(rawNameInput)

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const tryAdd = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!defNameInput)
        return new Err(new Panic())

      const device = await Ledger.USB.tryConnect().then(r => r.throw(t))

      const { address } = await Ledger.Ethereum.tryGetAddress(device, "44'/60'/0'/0/0").then(r => r.throw(t))

      const seed: SeedData = { type: "ledger", uuid, name: defNameInput, color, emoji, address }

      await background.tryRequest<void>({
        method: "brume_createSeed",
        params: [seed]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [defNameInput, uuid, color, emoji, background, close])

  const NameInput =
    <div className="flex items-stretch gap-2">
      <div className="shrink-0">
        <WalletAvatar className="s-5xl text-2xl"
          colorIndex={color}
          emoji={emoji} />
      </div>
      <Input.Contrast className="w-full"
        placeholder="Enter a name"
        value={rawNameInput}
        onChange={onNameInputChange} />
    </div>

  const canAdd = useMemo(() => {
    if (!defNameInput)
      return false
    return true
  }, [defNameInput])

  const AddButton =
    <Button.Gradient className="flex-1 whitespace-nowrap po-md"
      colorIndex={color}
      disabled={!canAdd}
      onClick={tryAdd.run}>
      <Button.Shrinker>
        <Outline.PlusIcon className="s-sm" />
        Add
      </Button.Shrinker>
    </Button.Gradient>

  return <Dialog close={close}>
    <Dialog.Title close={close}>
      New seed
    </Dialog.Title>
    <div className="h-2" />
    {NameInput}
    <div className="h-8" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      {AddButton}
    </div>
  </Dialog>
}