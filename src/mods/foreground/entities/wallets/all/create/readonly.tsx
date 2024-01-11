import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { UIError } from "@/libs/errors/errors";
import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { Textarea } from "@/libs/ui/textarea";
import { Wallet, WalletData } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { Address, ZeroHexString } from "@hazae41/cubane";
import { Option } from "@hazae41/option";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { useDeferredValue, useMemo, useState } from "react";
import { useEnsLookup } from "../../../names/data";
import { WalletAvatar } from "../../avatar";
import { useEthereumContext } from "../../data";

export function ReadonlyWalletCreatorDialog(props: {}) {
  const close = useCloseContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const uuid = useConstant(() => crypto.randomUUID())

  const mainnet = useEthereumContext(uuid, chainByChainId[1])

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

  const maybeEnsInput = defAddressInput.endsWith(".eth")
    ? defAddressInput
    : undefined
  const ensAddressQuery = useEnsLookup(maybeEnsInput, mainnet)

  const maybeAddress = defAddressInput.endsWith(".eth")
    ? ensAddressQuery.data?.inner
    : defAddressInput

  const tryAdd = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!defNameInput)
        return new Err(new Panic())

      const address = Option.wrap(maybeAddress).okOrElseSync(() => {
        return new UIError(`Could not fetch or parse address`)
      }).mapSync(x => Address.from(x) as ZeroHexString).throw(t)

      const wallet: WalletData = { coin: "ethereum", type: "readonly", uuid, name: defNameInput, color, emoji, address }

      await background.tryRequest<Wallet[]>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [defNameInput, maybeAddress, uuid, color, emoji, background, close])

  const addDisabled = useMemo(() => {
    if (tryAdd.loading)
      return "Loading..."
    if (!defNameInput)
      return "Please enter a name"
    if (!defAddressInput)
      return "Please enter an address"
    return undefined
  }, [tryAdd.loading, defNameInput, defAddressInput])

  const NameInput =
    <div className="flex items-stretch gap-2">
      <div className="shrink-0">
        <WalletAvatar className="size-12 text-2xl"
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
      placeholder="vitalik.eth"
      value={rawAddressInput}
      onChange={onAddressInputChange}
      rows={4} />

  const AddButon =
    <Button.Gradient className="grow po-md"
      colorIndex={color}
      disabled={Boolean(addDisabled)}
      onClick={tryAdd.run}>
      <div className={`${Button.Shrinker.className}`}>
        <Outline.PlusIcon className="size-5" />
        {addDisabled || "Add"}
      </div>
    </Button.Gradient>

  return <>
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
  </>
}
