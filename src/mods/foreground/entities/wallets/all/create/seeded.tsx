import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Ethereum } from "@/libs/ethereum";
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
import { SeedRef } from "@/mods/background/service_worker/entities/seeds/data";
import { Wallet, WalletData } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackground } from "@/mods/foreground/background/context";
import { Option } from "@hazae41/option";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { useCore } from "@hazae41/xswr";
import { secp256k1 } from "@noble/curves/secp256k1";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeed } from "@scure/bip39";
import { useDeferredValue, useMemo, useState } from "react";
import { SeedInstance } from "../../../seeds/all/data";
import { useSeedData } from "../../../seeds/context";
import { WalletAvatar } from "../../avatar";

export function SeededWalletCreatorDialog(props: CloseProps) {
  const { close } = props
  const core = useCore().unwrap()
  const background = useBackground().unwrap()
  const seedData = useSeedData()

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
        const device = await Ledger.USB.tryConnect().then(r => r.throw(t))
        const { address } = await Ledger.Ethereum.tryGetAddress(device, defPathInput.slice(2)).then(r => r.throw(t))

        const seed = SeedRef.from(seedData)

        const wallet: WalletData = { coin: "ethereum", type: "seeded", uuid, name: defNameInput, color, emoji, address, seed, path: defPathInput }

        await background.tryRequest<Wallet[]>({
          method: "brume_createWallet",
          params: [wallet]
        }).then(r => r.throw(t).throw(t))
      } else {
        const instance = await SeedInstance.tryFrom(seedData, core, background).then(r => r.throw(t))
        const mnemonic = await instance.tryGetMnemonic(core, background).then(r => r.throw(t))

        const masterSeed = await mnemonicToSeed(mnemonic)

        const root = HDKey.fromMasterSeed(masterSeed)
        const child = root.derive(defPathInput)

        const privateKeyBytes = Option.wrap(child.privateKey).ok().throw(t)
        const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)

        const address = Ethereum.Address.tryFrom(uncompressedPublicKeyBytes).throw(t)
        const seed = SeedRef.from(seedData)

        const wallet: WalletData = { coin: "ethereum", type: "seeded", uuid, name: defNameInput, color, emoji, address, seed, path: defPathInput }

        await background.tryRequest<Wallet[]>({
          method: "brume_createWallet",
          params: [wallet]
        }).then(r => r.throw(t).throw(t))
      }

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [defNameInput, defPathInput, seedData, defPathInput, uuid, color, emoji, core, background, close])

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

  const PathInput =
    <Input.Contrast className="w-full"
      placeholder="m/44'/60'/0'/0/0"
      value={rawPathInput}
      onChange={onPathInputChange} />

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
    {PathInput}
    <div className="h-8" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      {AddButon}
    </div>
  </Dialog>
}
