import { Color } from "@/libs/colors/colors";
import { UIError } from "@/libs/errors/errors";
import { chainByChainId } from "@/libs/ethereum/mods/chain";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { Results } from "@/libs/results/results";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { Wallet, WalletData } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { Address, ZeroHexString } from "@hazae41/cubane";
import { Option } from "@hazae41/option";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { useDeferredValue, useMemo, useState } from "react";
import { useEnsLookup } from "../../../names/data";
import { SimpleInput, SimpleLabel, SimpleTextarea, WideShrinkableGradientButton } from "../../actions/send";
import { SimpleWalletCard } from "../../card";
import { useEthereumContext } from "../../data";
import { EmptyWalletCard } from "./standalone";

export function ReadonlyWalletCreatorDialog(props: { uuid: string } & { color: Color } & { emoji: string }) {
  const close = useCloseContext().unwrap()
  const background = useBackgroundContext().unwrap()
  const { uuid, color, emoji } = props

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

  const tryAdd = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!finalNameInput)
        return new Err(new Panic())

      const address = Option.wrap(maybeAddress).okOrElseSync(() => {
        return new UIError(`Could not fetch or parse address`)
      }).mapSync(x => Address.from(x) as ZeroHexString).throw(t)

      const wallet: WalletData = { coin: "ethereum", type: "readonly", uuid, name: finalNameInput, color: Color.all.indexOf(color), emoji, address }

      await background.tryRequest<Wallet[]>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [finalNameInput, maybeAddress, uuid, color, emoji, background, close])

  const addDisabled = useMemo(() => {
    if (tryAdd.loading)
      return "Loading..."
    if (!finalNameInput)
      return "Please enter a name"
    if (!defAddressInput)
      return "Please enter an address"
    return undefined
  }, [tryAdd.loading, finalNameInput, defAddressInput])

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
      onClick={tryAdd.run}>
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
          <SimpleWalletCard
            uuid={uuid}
            name={finalNameInput}
            emoji={emoji}
            address={maybeAddress}
            color={color} />}
        {maybeAddress == null &&
          <EmptyWalletCard />}
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
