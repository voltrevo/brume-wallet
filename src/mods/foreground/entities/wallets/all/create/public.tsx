import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { UUIDProps } from "@/libs/react/props/uuid";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { Textarea } from "@/libs/ui/textarea";
import { Mutators } from "@/libs/xswr/mutators";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackground } from "@/mods/foreground/background/context";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { ethers } from "ethers";
import { useMemo, useState } from "react";
import { WalletAvatar } from "../../avatar";
import { useWallets } from "../data";

export function ReadonlyWalletCreatorDialog(props: CloseProps & UUIDProps) {
  const { close, uuid } = props

  const background = useBackground()
  const wallets = useWallets()

  const modhash = useModhash(uuid)
  const color = Colors.mod(modhash)
  const emoji = Emojis.get(modhash)

  const [name = "", setName] = useState<string>()

  const onNameChange = useInputChange(e => {
    setName(e.currentTarget.value)
  }, [])

  const [input = "", setInput] = useState<string>()

  const onInputChange = useTextAreaChange(e => {
    setInput(e.currentTarget.value)
  }, [])

  const valid = useMemo(() => {
    if (!input.startsWith("0x"))
      return false
    if (input.length !== 42)
      return false
    return true
  }, [input])

  const [error, setError] = useState<Error>()

  const tryAddReadonly = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!name)
        return new Err(new Panic())

      const address = ethers.getAddress(input)

      const wallet = { coin: "ethereum", type: "readonly", uuid, name, color, emoji, address }

      const walletsData = await background.tryRequest<Wallet[]>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      wallets.mutate(Mutators.data(walletsData))

      close()

      return Ok.void()
    }).then(r => r.inspectErrSync(setError))
  }, [name, valid, input, uuid, color, emoji, background, wallets.mutate, close])

  const NameInput =
    <div className="flex items-stretch gap-2">
      <div className="shrink-0">
        <WalletAvatar className="s-5xl text-2xl"
          colorIndex={color}
          emoji={emoji} />
      </div>
      <Input.Contrast className="w-full"
        placeholder="Enter a name"
        value={name} onChange={onNameChange} />
    </div>

  const KeyInput =
    <Textarea.Contrast className="w-full resize-none"
      placeholder="Enter an address"
      value={input} onChange={onInputChange}
      rows={4} />

  const AddReadonlyButon =
    <Button.Gradient className="w-full po-md"
      colorIndex={color}
      disabled={!name || !valid}
      onClick={tryAddReadonly.run}>
      <Button.Shrink>
        <Outline.PlusIcon className="s-sm" />
        Add
      </Button.Shrink>
    </Button.Gradient>

  return <Dialog close={close}>
    <Dialog.Title close={close}>
      New watch-only wallet
    </Dialog.Title>
    <div className="h-2" />
    {NameInput}
    <div className="h-4" />
    {KeyInput}
    {error && <div className="mt-2 text-red-400">
      An error occured: {Errors.toString(error)}
    </div>}
    <div className="h-4" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      {AddReadonlyButon}
    </div>
  </Dialog>
}
