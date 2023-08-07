import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { useConstant } from "@/libs/react/ref";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { Textarea } from "@/libs/ui/textarea";
import { Wallet, WalletData } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackground } from "@/mods/foreground/background/context";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { ethers } from "ethers";
import { useDeferredValue, useMemo, useState } from "react";
import { WalletAvatar } from "../../avatar";

export function ReadonlyWalletCreatorDialog(props: CloseProps) {
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

  const [rawAddressInput = "", setRawAddressInput] = useState<string>()

  const defAddressInput = useDeferredValue(rawAddressInput)

  const onAddressInputChange = useTextAreaChange(e => {
    setRawAddressInput(e.currentTarget.value)
  }, [])

  const canAdd = useMemo(() => {
    if (!defNameInput)
      return false
    if (!defAddressInput.startsWith("0x"))
      return false
    if (defAddressInput.length !== 42)
      return false
    return true
  }, [defNameInput, defAddressInput])

  const tryAdd = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!defNameInput)
        return new Err(new Panic())

      const address = ethers.getAddress(defAddressInput)

      const wallet: WalletData = { coin: "ethereum", type: "readonly", uuid, name: defNameInput, color, emoji, address }

      await background.tryRequest<Wallet[]>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.alert)
  }, [defNameInput, defAddressInput, uuid, color, emoji, background, close])

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

  const AddressInput =
    <Textarea.Contrast className="w-full resize-none"
      placeholder="Enter an address"
      value={rawAddressInput}
      onChange={onAddressInputChange}
      rows={4} />

  const AddButon =
    <Button.Gradient className="grow po-md"
      colorIndex={color}
      disabled={!defNameInput || !canAdd}
      onClick={tryAdd.run}>
      <Button.Shrink>
        <Outline.PlusIcon className="s-sm" />
        Add
      </Button.Shrink>
    </Button.Gradient>

  return <Dialog close={close}>
    <Dialog.Title close={close}>
      New wallet
    </Dialog.Title>
    <div className="h-2" />
    {NameInput}
    <div className="h-8" />
    {AddressInput}
    <div className="h-8" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      {AddButon}
    </div>
  </Dialog>
}
