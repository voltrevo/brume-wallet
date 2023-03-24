import { Outline } from "@/libs/icons/icons";
import { Dialog } from "@/libs/modals/dialog";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { Pipes } from "@/libs/xswr/pipes";
import { ContainedButton } from "@/mods/components/button";
import { Wallet } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { WalletAvatar } from "../avatar";
import { WalletData } from "../data";
import { useWallets } from "./data";

interface Key {
  address: string,
  privateKey: string
}

async function generateWallet() {
  await new Promise(ok => setTimeout(ok, 0)) // force async
  return Wallet.createRandom().privateKey
}

async function importWallet(privateKey: string) {
  await new Promise(ok => setTimeout(ok, 0)) // force async
  return new Wallet(privateKey)
}

export function WalletCreatorDialog(props: CloseProps) {
  const { close } = props
  const { mutate } = useWallets()

  const [name = "", setName] = useState<string>()

  const onNameChange = useInputChange(e => {
    setName(e.currentTarget.value)
  }, [])

  const [key = "", setKey] = useState<string>()

  const onKeyChange = useTextAreaChange(e => {
    setKey(e.currentTarget.value)
  }, [])

  useEffect(() => {
    generateWallet().then(setKey)
  }, [])

  const [wallet, setWallet] = useState<Wallet>()

  useEffect(() => {
    importWallet(key)
      .catch(() => undefined)
      .then(setWallet)
  }, [key])

  const onDoneClick = useCallback(() => {
    if (!name || !wallet) return

    const { address, privateKey } = wallet
    const walletd: WalletData = { name, address, privateKey }
    mutate(Pipes.data((prev = []) => [...prev, walletd]))

    close()
  }, [name, wallet, mutate, close])

  const Header =
    <h1 className="text-xl font-medium">
      New wallet
    </h1>

  const NameInput =
    <div className="flex items-center gap-2">
      <div className="shrink-0">
        <WalletAvatar
          size={2.5}
          textSize={1.5}
          address={wallet?.address} />
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
    <ContainedButton
      disabled={!name || !wallet}
      icon={Outline.PlusIcon}
      onClick={onDoneClick}>
      Add
    </ContainedButton>

  return <Dialog close={close}>
    {Header}
    <div className="h-2" />
    {NameInput}
    <div className="h-2" />
    {KeyInput}
    <div className="h-2" />
    {Info}
    <div className="grow" />
    {DoneButton}
  </Dialog>
}
