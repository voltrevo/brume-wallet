import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Ethereum } from "@/libs/ethereum";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useAsyncReplaceMemo } from "@/libs/react/memo";
import { CloseProps } from "@/libs/react/props/close";
import { useConstant } from "@/libs/react/ref";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { Textarea } from "@/libs/ui/textarea";
import { WebAuthnStorage, WebAuthnStorageError } from "@/libs/webauthn/webauthn";
import { WalletData } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackground } from "@/mods/foreground/background/context";
import { Base16 } from "@hazae41/base16";
import { Base64 } from "@hazae41/base64";
import { Bytes } from "@hazae41/bytes";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { secp256k1 } from "@noble/curves/secp256k1";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { WalletAvatar } from "../../avatar";

export function StandaloneWalletCreatorDialog(props: CloseProps) {
  const { close } = props
  const background = useBackground().unwrap()

  const uuid = useConstant(() => crypto.randomUUID())

  const modhash = useModhash(uuid)
  const color = Colors.mod(modhash)
  const emoji = Emojis.get(modhash)

  const [rawNameInput = "", setRawNameInput] = useState<string>()

  const defNameInput = useDeferredValue(rawNameInput)

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const [rawKeyInput = "", setRawKeyInput] = useState<string>()

  const defKeyInput = useDeferredValue(rawKeyInput)

  const onKeyInputChange = useTextAreaChange(e => {
    setRawKeyInput(e.currentTarget.value)
  }, [])

  const doGenerate = useAsyncUniqueCallback(async () => {
    const bytes = secp256k1.utils.randomPrivateKey()
    setRawKeyInput(`0x${Base16.get().tryEncode(bytes).unwrap()}`)
  }, [])

  const tryAddUnauthenticated = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!defNameInput)
        return new Err(new Panic())
      if (!defKeyInput.startsWith("0x"))
        return new Err(new Panic())

      const privateKeyBytes = Base16.get().tryPadStartAndDecode(defKeyInput.slice(2)).throw(t).copyAndDispose()

      const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
      // const compressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)

      const address = Ethereum.Address.tryFrom(uncompressedPublicKeyBytes).throw(t)

      // const uncompressedBitcoinAddress = await Bitcoin.Address.from(uncompressedPublicKeyBytes)
      // const compressedBitcoinAddress = await Bitcoin.Address.from(compressedPublicKeyBytes)

      const wallet: WalletData = { coin: "ethereum", type: "privateKey", uuid, name: defNameInput, color, emoji, address, privateKey: defKeyInput }

      await background.tryRequest<void>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [defNameInput, defKeyInput, uuid, color, emoji, background, close])

  const triedEncryptedPrivateKey = useAsyncReplaceMemo(async () => {
    return await Result.unthrow<Result<[string, string], Error>>(async t => {
      if (!defNameInput)
        return new Err(new Panic())
      if (!defKeyInput.startsWith("0x"))
        return new Err(new Panic())

      const privateKeyBytes = Base16.get().tryPadStartAndDecode(defKeyInput.slice(2)).throw(t).copyAndDispose()
      const privateKeyBase64 = Base64.get().tryEncodePadded(privateKeyBytes).throw(t)

      const [ivBase64, cipherBase64] = await background.tryRequest<[string, string]>({
        method: "brume_encrypt",
        params: [privateKeyBase64]
      }).then(r => r.throw(t).throw(t))

      return new Ok([ivBase64, cipherBase64])
    })
  }, [defNameInput, defKeyInput, background])

  const [id, setId] = useState<Uint8Array>()

  useEffect(() => {
    setId(undefined)
  }, [defKeyInput])

  const tryAddAuthenticated1 = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!defNameInput)
        return new Err(new Panic())
      if (!defKeyInput.startsWith("0x"))
        return new Err(new Panic())
      if (triedEncryptedPrivateKey == null)
        return new Err(new Panic())

      const [_, cipherBase64] = triedEncryptedPrivateKey.throw(t)
      const cipher = Base64.get().tryDecodePadded(cipherBase64).throw(t).copyAndDispose()
      const id = await WebAuthnStorage.create(defNameInput, cipher).then(r => r.throw(t))

      setId(id)

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [defNameInput, defKeyInput, triedEncryptedPrivateKey, uuid, color, emoji, background])

  const tryAddAuthenticated2 = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!defNameInput)
        return new Err(new Panic())
      if (!defKeyInput.startsWith("0x"))
        return new Err(new Panic())
      if (id == null)
        return new Err(new Panic())
      if (triedEncryptedPrivateKey == null)
        return new Err(new Panic())

      const privateKeyBytes = Base16.get().tryPadStartAndDecode(defKeyInput.slice(2)).throw(t).copyAndDispose()

      const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
      // const compressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)

      const address = Ethereum.Address.tryFrom(uncompressedPublicKeyBytes).throw(t)

      // const uncompressedBitcoinAddress = await Bitcoin.Address.from(uncompressedPublicKeyBytes)
      // const compressedBitcoinAddress = await Bitcoin.Address.from(compressedPublicKeyBytes)

      const [ivBase64, cipherBase64] = triedEncryptedPrivateKey.throw(t)
      const cipher = Base64.get().tryDecodePadded(cipherBase64).throw(t).copyAndDispose()
      const cipher2 = await WebAuthnStorage.get(id).then(r => r.throw(t))

      if (!Bytes.equals(cipher, cipher2))
        return new Err(new WebAuthnStorageError())

      const idBase64 = Base64.get().tryEncodePadded(id).throw(t)
      const privateKey = { ivBase64, idBase64 }

      const wallet: WalletData = { coin: "ethereum", type: "authPrivateKey", uuid, name: defNameInput, color, emoji, address, privateKey }

      await background.tryRequest<void>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [defNameInput, defKeyInput, id, triedEncryptedPrivateKey, uuid, color, emoji, background, close])

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

  const KeyInput =
    <Textarea.Contrast className="w-full resize-none"
      placeholder="Enter your private key"
      value={rawKeyInput}
      onChange={onKeyInputChange}
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
    if (!defNameInput)
      return false
    if (!defKeyInput.startsWith("0x"))
      return false
    if (!secp256k1.utils.isValidPrivateKey(defKeyInput.slice(2)))
      return false
    return true
  }, [defNameInput, defKeyInput])

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
