import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { UIError } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { Ledger } from "@/libs/ledger";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog, useDialogContext } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { SeedRef } from "@/mods/background/service_worker/entities/seeds/data";
import { Wallet, WalletData } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { Address, ZeroHexString } from "@hazae41/cubane";
import { Option } from "@hazae41/option";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { secp256k1 } from "@noble/curves/secp256k1";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeed } from "@scure/bip39";
import { SyntheticEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { SeedInstance } from "../../../seeds/all/helpers";
import { useSeedDataContext } from "../../../seeds/context";
import { WalletAvatar } from "../../avatar";

export function SeededWalletCreatorDialog(props: {}) {
  const { close } = useDialogContext().unwrap()
  const background = useBackgroundContext().unwrap()
  const seedData = useSeedDataContext()

  const uuid = useConstant(() => crypto.randomUUID())

  const modhash = useModhash(uuid)
  const color = Colors.mod(modhash)
  const emoji = Emojis.get(modhash)

  const [rawNameInput = "", setRawNameInput] = useState<string>()

  const defNameInput = useDeferredValue(rawNameInput)

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const [rawPathInput = "", setRawPathInput] = useState<string>("m/44'/60'/0'/0/0")

  const defPathInput = useDeferredValue(rawPathInput)

  const onPathInputChange = useInputChange(e => {
    setRawPathInput(e.currentTarget.value)
  }, [])

  const [coin, setCoin] = useState<string>("eth")

  const onCoinChange = useCallback((e: SyntheticEvent<HTMLSelectElement>) => {
    setCoin(e.currentTarget.value)
  }, [])

  const [app, setApp] = useState<string>("metamask")

  const onAppChange = useCallback((e: SyntheticEvent<HTMLSelectElement>) => {
    setApp(e.currentTarget.value)
  }, [])

  const [rawIndexInput = "", setRawIndexInput] = useState<string>("0")

  const defIndexInput = useDeferredValue(rawIndexInput)

  const onIndexInputChange = useInputChange(e => {
    setRawIndexInput(e.currentTarget.value)
  }, [coin, app])

  useEffect(() => {
    if (coin === "custom")
      return setRawPathInput("m/44'/60'/0'/0/0")

    const rawCoin = coin === "eth" ? "60" : "61"

    if (app === "custom")
      return setRawPathInput(`m/44'/${rawCoin}'/0'/0/0`)

    const rawInput = Number(defIndexInput).toFixed()

    if (app === "ledger")
      return setRawPathInput(`m/44'/${rawCoin}'/${rawInput}'/0/0`)
    if (app === "metamask")
      return setRawPathInput(`m/44'/${rawCoin}'/0'/0/${rawInput}`)
  }, [coin, app, defIndexInput])

  const canAdd = useMemo(() => {
    if (!defNameInput)
      return false
    if (!defPathInput)
      return false
    return true
  }, [defNameInput, defPathInput])

  const tryAdd = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!defNameInput)
        return new Err(new Panic())

      if (seedData.type === "ledger") {
        const device = await Ledger.USB.tryConnect().then(r => r.mapErrSync(cause => {
          return new UIError(`Could not connect to the device`, { cause })
        }).throw(t))

        const { address } = await Ledger.Ethereum.tryGetAddress(device, defPathInput.slice(2)).then(r => r.mapErrSync(cause => {
          return new UIError(`Could not get the address of the device`, { cause })
        }).throw(t))

        if (!ZeroHexString.is(address))
          return new Err(new UIError(`Could not get the address of the device`))

        const seed = SeedRef.from(seedData)

        const wallet: WalletData = { coin: "ethereum", type: "seeded", uuid, name: defNameInput, color, emoji, address, seed, path: defPathInput }

        await background.tryRequest<Wallet[]>({
          method: "brume_createWallet",
          params: [wallet]
        }).then(r => r.mapErrSync(cause => {
          return new UIError(`Could not communicate with the backend`, { cause })
        }).throw(t).mapErrSync(cause => {
          return new UIError(`Could not create the wallet`, { cause })
        }).throw(t))
      } else {
        const instance = await SeedInstance.tryFrom(seedData, background).then(r => r.get())

        const mnemonic = await instance.tryGetMnemonic(background).then(r => r.mapErrSync(cause => {
          return new UIError(`Could not get mnemonic`, { cause })
        }).throw(t))

        const masterSeed = await Result.runAndDoubleWrap(async () => {
          return await mnemonicToSeed(mnemonic)
        }).then(r => r.throw(t))

        const root = Result.runAndDoubleWrapSync(() => {
          return HDKey.fromMasterSeed(masterSeed)
        }).throw(t)

        const child = Result.runAndWrapSync(() => {
          return root.derive(defPathInput)
        }).mapErrSync((cause) => {
          return new UIError(`Invalid derivation path`, { cause })
        }).throw(t)

        const privateKeyBytes = Option.wrap(child.privateKey).ok().throw(t)
        const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)

        const address = Address.compute(uncompressedPublicKeyBytes)
        const seed = SeedRef.from(seedData)

        const wallet: WalletData = { coin: "ethereum", type: "seeded", uuid, name: defNameInput, color, emoji, address, seed, path: defPathInput }

        await background.tryRequest<Wallet[]>({
          method: "brume_createWallet",
          params: [wallet]
        }).then(r => r.mapErrSync(cause => {
          return new UIError(`Could not communicate with the backend`, { cause })
        }).throw(t).mapErrSync(cause => {
          return new UIError(`Could not create the wallet`, { cause })
        }).throw(t))
      }

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [defNameInput, defPathInput, seedData, defPathInput, uuid, color, emoji, background, close])

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

  const PathInput =
    <Input.Contrast className="w-full"
      placeholder="m/44'/60'/0'/0/0"
      value={rawPathInput}
      onChange={onPathInputChange} />

  const IndexInput =
    <Input.Contrast className="w-full"
      placeholder="0"
      type="number"
      min={0}
      value={rawIndexInput}
      onChange={onIndexInputChange} />

  const AddButon =
    <Button.Gradient className="grow po-md"
      colorIndex={color}
      disabled={!defNameInput || !canAdd}
      onClick={tryAdd.run}>
      <div className={`${Button.Shrinker.className}`}>
        <Outline.PlusIcon className="size-5" />
        Add
      </div>
    </Button.Gradient>

  return <>
    <Dialog.Title close={close}>
      New wallet
    </Dialog.Title>
    <div className="h-2" />
    {NameInput}
    <div className="h-4" />
    <div className="font-medium">
      Choose an account type
    </div>
    <div className="h-2" />
    <select className=""
      value={coin}
      onChange={onCoinChange}>
      <option value="eth">
        Ethereum
      </option>
      <option value="etc">
        Ethereum Classic
      </option>
      <option value="custom">
        Other
      </option>
    </select>
    {coin === "custom" && <>
      <div className="h-4" />
      <div className="font-medium">
        Choose a derivation path
      </div>
      <div className="h-2" />
      {PathInput}
    </>}
    {coin !== "custom" && <>
      <div className="h-2" />
      <select
        value={app}
        onChange={onAppChange}>
        <option value="metamask">
          MetaMask
        </option>
        <option value="ledger">
          Ledger Live
        </option>
        <option value="custom">
          Other
        </option>
      </select>
      {app === "custom" && <>
        <div className="h-4" />
        <div className="font-medium">
          Choose a derivation path
        </div>
        <div className="h-2" />
        {PathInput}
      </>}
      {app !== "custom" && <>
        <div className="h-4" />
        <div className="font-medium">
          Choose an account index
        </div>
        <div className="h-2" />
        {IndexInput}
        <div className="h-2" />
        <div className="text-contrast">
          Your derivation path will be {rawPathInput}
        </div>
      </>}
    </>}
    <div className="h-8" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      {AddButon}
    </div>
  </>
}
