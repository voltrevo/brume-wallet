import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Ethereum } from "@/libs/ethereum/ethereum";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useAsyncReplaceMemo } from "@/libs/react/memo";
import { CloseProps } from "@/libs/react/props/close";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { Textarea } from "@/libs/ui/textarea";
import { WebAuthnStorage, WebAuthnStorageError } from "@/libs/webauthn/webauthn";
import { WalletData } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackground } from "@/mods/foreground/background/context";
import { Bytes } from "@hazae41/bytes";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { secp256k1 } from "@noble/curves/secp256k1";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { WalletAvatar } from "../../avatar";

export function StandaloneWalletCreatorDialog(props: CloseProps) {
  const { close } = props
  const background = useBackground()

  const uuid = useMemo(() => {
    return crypto.randomUUID()
  }, [])

  const modhash = useModhash(uuid)
  const color = Colors.mod(modhash)
  const emoji = Emojis.get(modhash)

  const [rawName = "", setRawName] = useState<string>()

  const name = useDeferredValue(rawName)

  const onNameChange = useInputChange(e => {
    setRawName(e.currentTarget.value)
  }, [])

  const [rawInput = "", setRawInput] = useState<string>()

  const input = useDeferredValue(rawInput)

  const onInputChange = useTextAreaChange(e => {
    setRawInput(e.currentTarget.value)
  }, [])

  const doGenerate = useAsyncUniqueCallback(async () => {
    const bytes = secp256k1.utils.randomPrivateKey()
    setRawInput(`0x${Bytes.toHex(bytes)}`)
  }, [])

  const tryAddUnauthenticated = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!name)
        return new Err(new Panic())
      if (!input.startsWith("0x"))
        return new Err(new Panic())

      const privateKeyBytes = Bytes.fromHexSafe(input.slice(2))

      const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
      // const compressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)

      const address = Ethereum.Address.from(uncompressedPublicKeyBytes)

      // const uncompressedBitcoinAddress = await Bitcoin.Address.from(uncompressedPublicKeyBytes)
      // const compressedBitcoinAddress = await Bitcoin.Address.from(compressedPublicKeyBytes)

      const wallet: WalletData = { coin: "ethereum", type: "privateKey", uuid, name, color, emoji, address, privateKey: input }

      await background.tryRequest<void>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.alert)
  }, [name, input, uuid, color, emoji, background, close])

  const triedEncryptedPrivateKey = useAsyncReplaceMemo(async () => {
    return await Result.unthrow<Result<[string, string], Error>>(async t => {
      if (!name)
        return new Err(new Panic())
      if (!input.startsWith("0x"))
        return new Err(new Panic())

      const privateKeyBytes = Bytes.fromHexSafe(input.slice(2))
      const privateKeyBase64 = Bytes.toBase64(privateKeyBytes)

      const [ivBase64, cipherBase64] = await background.tryRequest<[string, string]>({
        method: "brume_encrypt",
        params: [privateKeyBase64]
      }).then(r => r.throw(t).throw(t))

      return new Ok([ivBase64, cipherBase64])
    })
  }, [name, input, background])

  const [id, setId] = useState<Uint8Array>()

  useEffect(() => {
    setId(undefined)
  }, [input])

  const tryAddAuthenticated1 = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!name)
        return new Err(new Panic())
      if (!input.startsWith("0x"))
        return new Err(new Panic())
      if (triedEncryptedPrivateKey == null)
        return new Err(new Panic())

      const [_, cipherBase64] = triedEncryptedPrivateKey.throw(t)
      const cipher = Bytes.fromBase64(cipherBase64)
      const id = await WebAuthnStorage.create(name, cipher).then(r => r.throw(t))

      setId(id)

      return Ok.void()
    }).then(Results.alert)
  }, [name, input, triedEncryptedPrivateKey, uuid, color, emoji, background])

  const tryAddAuthenticated2 = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!name)
        return new Err(new Panic())
      if (!input.startsWith("0x"))
        return new Err(new Panic())
      if (id == null)
        return new Err(new Panic())
      if (triedEncryptedPrivateKey == null)
        return new Err(new Panic())

      const privateKeyBytes = Bytes.fromHexSafe(input.slice(2))

      const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
      // const compressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)

      const address = Ethereum.Address.from(uncompressedPublicKeyBytes)

      // const uncompressedBitcoinAddress = await Bitcoin.Address.from(uncompressedPublicKeyBytes)
      // const compressedBitcoinAddress = await Bitcoin.Address.from(compressedPublicKeyBytes)

      const [ivBase64, cipherBase64] = triedEncryptedPrivateKey.throw(t)
      const cipher = Bytes.fromBase64(cipherBase64)
      const cipher2 = await WebAuthnStorage.get(id).then(r => r.throw(t))

      if (!Bytes.equals(cipher, cipher2))
        return new Err(new WebAuthnStorageError())

      const idBase64 = Bytes.toBase64(id)
      const privateKey = { ivBase64, idBase64 }

      const wallet: WalletData = { coin: "ethereum", type: "authPrivateKey", uuid, name, color, emoji, address, privateKey }

      await background.tryRequest<void>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.alert)
  }, [name, input, id, triedEncryptedPrivateKey, uuid, color, emoji, background, close])

  const NameInput =
    <div className="flex items-stretch gap-2">
      <div className="shrink-0">
        <WalletAvatar className="s-5xl text-2xl"
          colorIndex={color}
          emoji={emoji} />
      </div>
      <Input.Contrast className="w-full"
        placeholder="Enter a name"
        value={name}
        onChange={onNameChange} />
    </div>

  const KeyInput =
    <Textarea.Contrast className="w-full resize-none"
      placeholder="Enter your private key"
      value={input}
      onChange={onInputChange}
      rows={4} />

  const GenerateButton =
    <Button.Contrast className="flex-1 whitespace-nowrap po-md"
      onClick={doGenerate.run}>
      <Button.Shrink>
        <Outline.KeyIcon className="s-sm" />
        Generate a private key
      </Button.Shrink>
    </Button.Contrast>

  const canAdd = useMemo(() => {
    if (!name)
      return false
    if (!input.startsWith("0x"))
      return false
    if (!secp256k1.utils.isValidPrivateKey(input.slice(2)))
      return false
    return true
  }, [name, input])

  const AddUnauthButton =
    <Button.Contrast className="flex-1 whitespace-nowrap po-md"
      disabled={!canAdd}
      onClick={tryAddUnauthenticated.run}>
      <Button.Shrink>
        <Outline.PlusIcon className="s-sm" />
        Add without authentication
      </Button.Shrink>
    </Button.Contrast>

  const AddAuthButton1 =
    <Button.Gradient className="flex-1 whitespace-nowrap po-md"
      colorIndex={color}
      disabled={!canAdd}
      onClick={tryAddAuthenticated1.run}>
      <Button.Shrink>
        <Outline.LockClosedIcon className="s-sm" />
        Add with authentication
      </Button.Shrink>
    </Button.Gradient>

  const AddAuthButton2 =
    <Button.Gradient className="flex-1 whitespace-nowrap po-md"
      colorIndex={color}
      disabled={!canAdd}
      onClick={tryAddAuthenticated2.run}>
      <Button.Shrink>
        <Outline.LockClosedIcon className="s-sm" />
        Add with authentication (1/2)
      </Button.Shrink>
    </Button.Gradient>

  return <Dialog close={close}>
    <Dialog.Title close={close}>
      New wallet
    </Dialog.Title>
    <div className="h-2" />
    {NameInput}
    <div className="h-8" />
    {KeyInput}
    <div className="flex items-center flex-wrap-reverse gap-2">
      {GenerateButton}
    </div>
    <div className="h-8" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      {AddUnauthButton}
      {id == null
        ? AddAuthButton1
        : AddAuthButton2}
    </div>
  </Dialog>
}
