import { Colors } from "@/libs/colors/colors";
import { Button } from "@/libs/components/button";
import { Dialog } from "@/libs/components/dialog/dialog";
import { Input } from "@/libs/components/input";
import { Textarea } from "@/libs/components/textarea";
import { Emojis } from "@/libs/emojis/emojis";
import { Errors } from "@/libs/errors/errors";
import { Ethereum } from "@/libs/ethereum/ethereum";
import { Ethers } from "@/libs/ethers/ethers";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { Promises } from "@/libs/promises/promises";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useAsyncReplaceMemo } from "@/libs/react/memo";
import { CloseProps } from "@/libs/react/props/close";
import { WebAuthnStorage } from "@/libs/webauthn/webauthn";
import { Mutators } from "@/libs/xswr/mutators";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackground } from "@/mods/foreground/background/context";
import { Bytes } from "@hazae41/bytes";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { secp256k1 } from "@noble/curves/secp256k1";
import { ethers } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { WalletAvatar } from "../avatar";
import { useWallets } from "./data";

export function WalletCreatorDialog(props: CloseProps) {
  const { close } = props

  const background = useBackground()
  const wallets = useWallets()

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

  const [input = "", setInput] = useState<string>()

  const onInputChange = useTextAreaChange(e => {
    setInput(e.currentTarget.value)
  }, [])

  useEffect(() => {
    Promises.fork().then(() => setInput(Ethers.Wallet.tryRandom().ok().inner?.privateKey))
  }, [])

  const type = useMemo(() => {
    if (!input.startsWith("0x"))
      return undefined
    if (input.length === 42)
      return "address"
    if (input.length === 66)
      return "privateKey"
    return undefined
  }, [input])

  const ewallet = useAsyncReplaceMemo(async () => {
    if (type !== "privateKey")
      return undefined
    return Ethers.Wallet.tryFrom(input).ok().inner
  }, [input])

  const [error, setError] = useState<Error>()

  const encryptedPrivateKeyResult = useAsyncReplaceMemo(async () => {
    return await Result.unthrow<Result<[string, string], Error>>(async t => {
      if (type !== "privateKey")
        return new Err(new Panic())
      if (!ewallet)
        return new Err(new Panic())

      const privateKeyBytes = Bytes.fromHexSafe(ewallet.privateKey.slice(2))

      const plainBase64 = Bytes.toBase64(privateKeyBytes)

      const [ivBase64, cipherBase64] = await background.tryRequest<[string, string]>({
        method: "brume_encrypt",
        params: [plainBase64]
      }).then(r => r.throw(t).throw(t))

      return new Ok([ivBase64, cipherBase64])
    })
  }, [type, ewallet, background])

  const tryAddWallet = useAsyncUniqueCallback(async (authenticated: boolean) => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!name || !type)
        return new Err(new Panic())

      if (type === "address") {
        const address = ethers.getAddress(input)

        const wallet = { coin: "ethereum", type: "readonly", uuid, name, color, emoji, address }

        const walletsData = await background.tryRequest<Wallet[]>({
          method: "brume_newWallet",
          params: [wallet]
        }).then(r => r.throw(t).throw(t))

        wallets.mutate(Mutators.data(walletsData))

        close()

        return Ok.void()
      }

      if (type === "privateKey") {
        if (!ewallet || !encryptedPrivateKeyResult)
          return new Err(new Panic())

        const privateKeyBytes = Bytes.fromHexSafe(ewallet.privateKey.slice(2))

        const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
        // const compressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)

        const privateKey = `0x${Bytes.toHex(privateKeyBytes)}`
        const address = Ethereum.Address.from(uncompressedPublicKeyBytes)

        // const uncompressedBitcoinAddress = await Bitcoin.Address.from(uncompressedPublicKeyBytes)
        // const compressedBitcoinAddress = await Bitcoin.Address.from(compressedPublicKeyBytes)

        if (authenticated) {
          const [ivBase64, cipherBase64] = encryptedPrivateKeyResult.throw(t)

          const cipher = Bytes.fromBase64(cipherBase64)

          const id = await WebAuthnStorage.create(name, cipher).then(r => r.throw(t))

          const idBase64 = Bytes.toBase64(id)

          const privateKey = { ivBase64, idBase64 }

          const wallet = { coin: "ethereum", type: "authPrivateKey", uuid, name, color, emoji, address, privateKey }

          const walletsData = await background.tryRequest<Wallet[]>({
            method: "brume_newWallet",
            params: [wallet]
          }).then(r => r.throw(t).throw(t))

          wallets.mutate(Mutators.data(walletsData))

          close()

          return Ok.void()
        } else {
          const wallet = { coin: "ethereum", type: "privateKey", uuid, name, color, emoji, address, privateKey }

          const walletsData = await background.tryRequest<Wallet[]>({
            method: "brume_newWallet",
            params: [wallet]
          }).then(r => r.throw(t).throw(t))

          wallets.mutate(Mutators.data(walletsData))

          close()

          return Ok.void()
        }
      }

      throw new Panic()
    }).then(r => r.inspectErrSync(setError))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, type, ewallet, uuid, name, color, emoji, background, encryptedPrivateKeyResult, wallets.mutate, close])

  const onNoAuthClick = useAsyncUniqueCallback(async () => {
    await tryAddWallet.run(false)
  }, [tryAddWallet])

  const onAuthClick = useAsyncUniqueCallback(async () => {
    await tryAddWallet.run(true)
  }, [tryAddWallet])

  const NameInput =
    <div className="flex items-stretch gap-2">
      <div className="shrink-0">
        <WalletAvatar className="icon-5xl text-2xl"
          colorIndex={color}
          emoji={emoji} />
      </div>
      <Input.Contrast className="w-full"
        placeholder="Enter a name"
        value={name} onChange={onNameChange} />
    </div>

  const KeyInput =
    <Textarea.Contrast className="w-full resize-none"
      placeholder="Enter your private key"
      value={input} onChange={onInputChange}
      rows={4} />

  const Info =
    <div className="text-contrast">
      {`We have generated a new Ethereum private key just for you. You can enter your own private key to import an existing wallet. You can enter an Ethereum address to add a readonly wallet.`}
    </div>

  const AddWithoutAuthButton =
    <Button.Contrast className="w-full p-md"
      disabled={!name || !type}
      onClick={onNoAuthClick.run}>
      <Button.Shrink>
        <Outline.PlusIcon className="icon-sm" />
        Add without authentication
      </Button.Shrink>
    </Button.Contrast>

  const AddWithAuthButton =
    <Button.Gradient className="w-full p-md"
      colorIndex={color}
      disabled={!name || !type}
      onClick={onAuthClick.run}>
      <Button.Shrink>
        <Outline.LockClosedIcon className="icon-sm" />
        Add with authentication
      </Button.Shrink>
    </Button.Gradient>

  const AddReadonlyButon =
    <Button.Gradient className="w-full p-md"
      colorIndex={color}
      disabled={!name || !type}
      onClick={onNoAuthClick.run}>
      <Button.Shrink>
        <Outline.PlusIcon className="icon-sm" />
        Add
      </Button.Shrink>
    </Button.Gradient>

  return <Dialog close={close}>
    <Dialog.Title close={close}>
      New wallet
    </Dialog.Title>
    <div className="h-2" />
    {NameInput}
    <div className="h-4" />
    {KeyInput}
    <div className="h-2" />
    {Info}
    {error && <div className="mt-2 text-red-400">
      An error occured: {Errors.toString(error)}
    </div>}
    <div className="h-4" />
    {type === "address" &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        {AddReadonlyButon}
      </div>}
    {type !== "address" &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        {AddWithoutAuthButton}
        {AddWithAuthButton}
      </div>}
  </Dialog>
}
