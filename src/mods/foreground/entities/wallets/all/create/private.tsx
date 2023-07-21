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
import { UUIDProps } from "@/libs/react/props/uuid";
import { WebAuthnStorage, WebAuthnStorageError } from "@/libs/webauthn/webauthn";
import { Mutators } from "@/libs/xswr/mutators";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackground } from "@/mods/foreground/background/context";
import { Bytes } from "@hazae41/bytes";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { secp256k1 } from "@noble/curves/secp256k1";
import { useEffect, useState } from "react";
import { WalletAvatar } from "../../avatar";
import { useWallets } from "../data";

export function PrivateKeyWalletCreatorDialog(props: CloseProps & UUIDProps) {
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

  useEffect(() => {
    Promises.fork().then(() => setInput(Ethers.Wallet.tryRandom().ok().inner?.privateKey))
  }, [])

  const ethersWallet = useAsyncReplaceMemo(async () => {
    return Ethers.Wallet.tryFrom(input).ok().inner
  }, [input])

  const [error, setError] = useState<Error>()

  const encryptedPrivateKeyResult = useAsyncReplaceMemo(async () => {
    return await Result.unthrow<Result<[string, string], Error>>(async t => {
      if (!ethersWallet)
        return new Err(new Panic())

      const privateKeyBytes = Bytes.fromHexSafe(ethersWallet.privateKey.slice(2))

      const plainBase64 = Bytes.toBase64(privateKeyBytes)

      const [ivBase64, cipherBase64] = await background.tryRequest<[string, string]>({
        method: "brume_encrypt",
        params: [plainBase64]
      }).then(r => r.throw(t).throw(t))

      return new Ok([ivBase64, cipherBase64])
    })
  }, [ethersWallet, background])

  const tryAddUnauthenticated = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!name)
        return new Err(new Panic())

      if (ethersWallet == null)
        return new Err(new Panic())

      const privateKeyBytes = Bytes.fromHexSafe(ethersWallet.privateKey.slice(2))

      const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
      // const compressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)

      const privateKey = `0x${Bytes.toHex(privateKeyBytes)}`
      const address = Ethereum.Address.from(uncompressedPublicKeyBytes)

      // const uncompressedBitcoinAddress = await Bitcoin.Address.from(uncompressedPublicKeyBytes)
      // const compressedBitcoinAddress = await Bitcoin.Address.from(compressedPublicKeyBytes)

      const wallet = { coin: "ethereum", type: "privateKey", uuid, name, color, emoji, address, privateKey }

      const walletsData = await background.tryRequest<Wallet[]>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      wallets.mutate(Mutators.data(walletsData))

      close()

      return Ok.void()
    }).then(r => r.inspectErrSync(setError))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, ethersWallet, uuid, color, emoji, background, wallets.mutate, close])

  const [id, setId] = useState<Uint8Array>()

  useEffect(() => {
    setId(undefined)
  }, [input])

  const tryCreateAuthenticated = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!name)
        return new Err(new Panic())

      if (ethersWallet == null)
        return new Err(new Panic())
      if (encryptedPrivateKeyResult == null)
        return new Err(new Panic())

      const [_, cipherBase64] = encryptedPrivateKeyResult.throw(t)

      const cipher = Bytes.fromBase64(cipherBase64)

      const id = await WebAuthnStorage.create(name, cipher).then(r => r.throw(t))

      setId(id)

      return Ok.void()
    }).then(r => r.inspectErrSync(setError))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, ethersWallet, encryptedPrivateKeyResult, uuid, color, emoji, background, wallets.mutate, close])

  const tryAddAuthenticated = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!name)
        return new Err(new Panic())

      if (id == null)
        return new Err(new Panic())
      if (ethersWallet == null)
        return new Err(new Panic())
      if (encryptedPrivateKeyResult == null)
        return new Err(new Panic())

      const privateKeyBytes = Bytes.fromHexSafe(ethersWallet.privateKey.slice(2))

      const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
      // const compressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)

      const address = Ethereum.Address.from(uncompressedPublicKeyBytes)

      // const uncompressedBitcoinAddress = await Bitcoin.Address.from(uncompressedPublicKeyBytes)
      // const compressedBitcoinAddress = await Bitcoin.Address.from(compressedPublicKeyBytes)

      const [ivBase64, cipherBase64] = encryptedPrivateKeyResult.throw(t)

      const cipher = Bytes.fromBase64(cipherBase64)

      const cipher2 = await WebAuthnStorage.get(id).then(r => r.throw(t))

      if (!Bytes.equals(cipher, cipher2))
        return new Err(new WebAuthnStorageError())

      const idBase64 = Bytes.toBase64(id)

      const privateKey = { ivBase64, idBase64 }

      const wallet = { coin: "ethereum", type: "authPrivateKey", uuid, name, color, emoji, address, privateKey }

      const walletsData = await background.tryRequest<Wallet[]>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      wallets.mutate(Mutators.data(walletsData))

      close()

      return Ok.void()
    }).then(r => r.inspectErrSync(setError))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, id, ethersWallet, encryptedPrivateKeyResult, uuid, color, emoji, background, wallets.mutate, close])

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
      {`We have generated a new Ethereum private key just for you. You can enter your own private key to import an existing wallet.`}
    </div>

  const AddUnauthButton =
    <Button.Contrast className="w-full p-md"
      disabled={!name || !ethersWallet}
      onClick={tryAddUnauthenticated.run}>
      <Button.Shrink>
        <Outline.PlusIcon className="icon-sm" />
        Add without authentication
      </Button.Shrink>
    </Button.Contrast>

  const AddAuthButton1 =
    <Button.Gradient className="w-full p-md"
      colorIndex={color}
      disabled={!name || !ethersWallet}
      onClick={tryCreateAuthenticated.run}>
      <Button.Shrink>
        <Outline.LockClosedIcon className="icon-sm" />
        Add with authentication
      </Button.Shrink>
    </Button.Gradient>

  const AddAuthButton2 =
    <Button.Gradient className="w-full p-md"
      colorIndex={color}
      disabled={!name || !ethersWallet}
      onClick={tryAddAuthenticated.run}>
      <Button.Shrink>
        <Outline.LockClosedIcon className="icon-sm" />
        Add with authentication (1/2)
      </Button.Shrink>
    </Button.Gradient>

  const AddAuthButton = <>
    {id == null
      ? AddAuthButton1
      : AddAuthButton2}
  </>

  return <Dialog close={close}>
    <Dialog.Title close={close}>
      New private key wallet
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
    <div className="flex items-center flex-wrap-reverse gap-2">
      {AddUnauthButton}
      {AddAuthButton}
    </div>
  </Dialog>
}
