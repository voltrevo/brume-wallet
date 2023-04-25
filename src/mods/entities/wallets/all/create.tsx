import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Ethereum } from "@/libs/ethereum/ethereum";
import { Outline } from "@/libs/icons/icons";
import { Dialog, DialogTitle } from "@/libs/modals/dialog";
import { useModhash } from "@/libs/modhash/modhash";
import { Promises } from "@/libs/promises/promises";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useAsyncReplaceMemo } from "@/libs/react/memo";
import { CloseProps } from "@/libs/react/props/close";
import { Mutator } from "@/libs/xswr/pipes";
import { GradientButton } from "@/mods/components/buttons/button";
import { Bytes } from "@hazae41/bytes";
import { Result } from "@hazae41/result";
import { secp256k1 } from "@noble/curves/secp256k1";
import { Wallet } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { WalletAvatar } from "../avatar";
import { WalletData } from "../data";
import { useWallets } from "./data";

export namespace Wallets {

  export function random() {
    return Result.tryWrapSync(() => Wallet.createRandom().privateKey)
  }

  export function from(privateKey: string) {
    return Result.tryWrapSync(() => new Wallet(privateKey))
  }

}

export function WalletCreatorDialog(props: CloseProps) {
  const { close } = props
  const { mutate } = useWallets()

  const uuid = useMemo(() => {
    return crypto.randomUUID()
  }, [])

  const modhash = useModhash(uuid)
  const color = Colors.mod(modhash)
  const emoji = Emojis.get(modhash)

  const [name = "", setName] = useState<string>()

  const onNameChange = useInputChange(e => {
    setName(e.currentTarget.value)
  }, [])

  const [key = "", setKey] = useState<string>()

  const onKeyChange = useTextAreaChange(e => {
    setKey(e.currentTarget.value)
  }, [])

  useEffect(() => {
    Promises.fork().then(() => setKey(Wallets.random().ok().inner))
  }, [])

  const wallet = useAsyncReplaceMemo(async () => {
    if (key) return Wallets.from(key).ok().inner
  }, [key])

  const onDoneClick = useAsyncUniqueCallback(async () => {
    if (!name || !wallet) return

    const privateKeyBytes = Bytes.fromHex(wallet.signingKey.privateKey.slice(2))

    const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
    // const compressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)

    const privateKey = `0x${Bytes.toHex(privateKeyBytes)}`
    const address = Ethereum.Address.from(uncompressedPublicKeyBytes)

    // const uncompressedBitcoinAddress = await Bitcoin.Address.from(uncompressedPublicKeyBytes)
    // const compressedBitcoinAddress = await Bitcoin.Address.from(compressedPublicKeyBytes)

    const walletd: WalletData = { coin: "ethereum", type: "privateKey", uuid, name, color, emoji, privateKey, address }
    mutate(Mutator.data((prev = []) => [...prev, walletd]))

    close()
  }, [uuid, name, color, emoji, wallet, mutate, close])

  const NameInput =
    <div className="flex items-center gap-2">
      <div className="shrink-0">
        <WalletAvatar className="icon-5xl text-2xl"
          color={color}
          emoji={emoji} />
      </div>
      <input className="p-xmd w-full rounded-xl outline-none bg-transparent border border-contrast focus:border-opposite"
        placeholder="Enter a name"
        value={name} onChange={onNameChange} />
    </div>

  const KeyInput =
    <textarea className="p-xmd w-full resize-none rounded-xl bg-transparent outline-none border border-contrast focus:border-opposite"
      placeholder="Enter your private key"
      value={key} onChange={onKeyChange}
      rows={4} />

  const Info =
    <div className="text-contrast text-sm">
      {`We have generated a new private key just for you. You can also enter your own private key to import an existing wallet.`}
    </div>

  const DoneButton =
    <GradientButton className="w-full"
      colorIndex={color}
      disabled={!name || !wallet}
      icon={Outline.PlusIcon}
      onClick={onDoneClick.run}>
      Add
    </GradientButton>

  return <Dialog close={close}>
    <DialogTitle close={close}>
      New wallet
    </DialogTitle>
    <div className="h-2" />
    {NameInput}
    <div className="h-2" />
    {KeyInput}
    <div className="h-2" />
    {Info}
    <div className="h-4" />
    {DoneButton}
  </Dialog>
}
