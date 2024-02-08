import { Color } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Errors, UIError } from "@/libs/errors/errors";
import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { Wallet, WalletData } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { Address, ZeroHexString } from "@hazae41/cubane";
import { Option } from "@hazae41/option";
import { Panic } from "@hazae41/result";
import { useDeferredValue, useMemo, useState } from "react";
import { useEnsLookup } from "../../../names/data";
import { SimpleInput, SimpleLabel, SimpleTextarea, WideShrinkableGradientButton } from "../../actions/send";
import { RawWalletCard } from "../../card";
import { useEthereumContext } from "../../data";
import { EmptyRectangularCard } from "./standalone";

export function ReadonlyWalletCreatorDialog(props: {}) {
  const close = useCloseContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const uuid = useConstant(() => crypto.randomUUID())

  const modhash = useModhash(uuid)
  const color = Color.get(modhash)
  const emoji = Emojis.get(modhash)

  const mainnet = useEthereumContext(uuid, chainByChainId[1])

  const [rawNameInput = "", setRawNameInput] = useState<string>()

  const defNameInput = useDeferredValue(rawNameInput)

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const finalNameInput = useMemo(() => {
    return defNameInput || "Vitalik"
  }, [defNameInput])

  const [rawAddressInput = "", setRawAddressInput] = useState<string>()

  const defAddressInput = useDeferredValue(rawAddressInput)

  const onAddressInputChange = useTextAreaChange(e => {
    setRawAddressInput(e.currentTarget.value)
  }, [])

  const maybeEnsKey = useMemo(() => {
    if (!defAddressInput.endsWith(".eth"))
      return
    return defAddressInput
  }, [defAddressInput])

  const ensAddressQuery = useEnsLookup(maybeEnsKey, mainnet)
  const maybeEnsAddress = ensAddressQuery.current?.ok().get()

  const maybeAddress = useMemo(() => {
    if (maybeEnsAddress != null)
      return maybeEnsAddress
    if (ZeroHexString.is(defAddressInput))
      return defAddressInput
    return undefined
  }, [defAddressInput, maybeEnsAddress])

  const addOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    if (!finalNameInput)
      throw new Panic()

    const address = Option.wrap(maybeAddress).okOrElseSync(() => {
      return new UIError(`Could not fetch or parse address`)
    }).mapSync(x => Address.from(x) as ZeroHexString).unwrap()

    const wallet: WalletData = { coin: "ethereum", type: "readonly", uuid, name: finalNameInput, color: Color.all.indexOf(color), emoji, address }

    await background.requestOrThrow<Wallet[]>({
      method: "brume_createWallet",
      params: [wallet]
    }).then(r => r.unwrap())

    close()
  }), [finalNameInput, maybeAddress, uuid, color, emoji, background, close])

  const addDisabled = useMemo(() => {
    if (addOrAlert.loading)
      return "Loading..."
    if (!finalNameInput)
      return "Please enter a name"
    if (!defAddressInput)
      return "Please enter an address"
    return undefined
  }, [addOrAlert.loading, finalNameInput, defAddressInput])

  const NameInput =
    <SimpleLabel>
      <div className="shrink-0">
        Name
      </div>
      <div className="w-4" />
      <SimpleInput
        placeholder="Vitalik"
        value={rawNameInput}
        onChange={onNameInputChange} />
    </SimpleLabel>

  const AddressInput =
    <SimpleLabel>
      <div className="shrink-0">
        Address
      </div>
      <div className="w-4" />
      <SimpleTextarea
        placeholder="vitalik.eth"
        value={rawAddressInput}
        onChange={onAddressInputChange}
        rows={4} />
    </SimpleLabel>

  const AddButon =
    <WideShrinkableGradientButton
      color={color}
      disabled={Boolean(addDisabled)}
      onClick={addOrAlert.run}>
      <Outline.PlusIcon className="size-5" />
      {addDisabled || "Add"}
    </WideShrinkableGradientButton>

  return <>
    <Dialog.Title>
      New wallet
    </Dialog.Title>
    <div className="h-4" />
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        {maybeAddress != null &&
          <div className="w-full aspect-video rounded-xl">
            <RawWalletCard
              uuid={uuid}
              name={finalNameInput}
              emoji={emoji}
              address={maybeAddress}
              color={color} />
          </div>}
        {maybeAddress == null &&
          <EmptyRectangularCard />}
      </div>
    </div>
    <div className="h-2" />
    <div className="flex-1 flex flex-col">
      <div className="grow" />
      {NameInput}
      <div className="h-2" />
      {AddressInput}
      <div className="h-4" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        {AddButon}
      </div>
    </div>
  </>
}
