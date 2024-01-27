import { Color } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useAsyncReplaceMemo } from "@/libs/react/memo";
import { useConstant } from "@/libs/react/ref";
import { Results } from "@/libs/results/results";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { WebAuthnStorage, WebAuthnStorageError } from "@/libs/webauthn/webauthn";
import { WalletData } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { Base16 } from "@hazae41/base16";
import { Base64 } from "@hazae41/base64";
import { Bytes } from "@hazae41/bytes";
import { Address, ZeroHexString } from "@hazae41/cubane";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { secp256k1 } from "@noble/curves/secp256k1";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { SimpleInput, SimpleLabel, SimpleTextarea, WideShrinkableContrastButton, WideShrinkableGradientButton } from "../../actions/send";
import { SimpleWalletCard } from "../../card";

export function StandaloneWalletCreatorDialog(props: {}) {
  const close = useCloseContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const uuid = useConstant(() => crypto.randomUUID())

  const modhash = useModhash(uuid)
  const color = Color.get(modhash)
  const emoji = Emojis.get(modhash)

  const [rawNameInput = "", setRawNameInput] = useState<string>()

  const defNameInput = useDeferredValue(rawNameInput)

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const finalNameInput = useMemo(() => {
    return defNameInput || "Holder"
  }, [defNameInput])

  const [rawKeyInput = "", setRawKeyInput] = useState<string>()

  const defKeyInput = useDeferredValue(rawKeyInput)
  const zeroHexKey = ZeroHexString.from(defKeyInput)

  const onKeyInputChange = useTextAreaChange(e => {
    setRawKeyInput(e.currentTarget.value)
  }, [])

  const doGenerate = useAsyncUniqueCallback(async () => {
    const bytes = secp256k1.utils.randomPrivateKey()
    setRawKeyInput(`0x${Base16.get().tryEncode(bytes).unwrap()}`)
  }, [])

  const triedAddress = useMemo(() => Result.runAndDoubleWrapSync(() => {
    const privateKeyBytes = Base16.get().padStartAndDecodeOrThrow(zeroHexKey.slice(2)).copyAndDispose()
    const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)

    return Address.compute(uncompressedPublicKeyBytes)
  }), [zeroHexKey])

  const tryAddUnauthenticated = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!finalNameInput)
        return new Err(new Panic())
      if (!secp256k1.utils.isValidPrivateKey(zeroHexKey.slice(2)))
        return new Err(new Panic())
      if (!confirm("Did you backup your private key?"))
        return Ok.void()

      const privateKeyBytes = Base16.get().tryPadStartAndDecode(zeroHexKey.slice(2)).throw(t).copyAndDispose()

      // TODO: use adapter
      const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
      // const compressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)

      const address = Address.compute(uncompressedPublicKeyBytes)

      // const uncompressedBitcoinAddress = await Bitcoin.Address.from(uncompressedPublicKeyBytes)
      // const compressedBitcoinAddress = await Bitcoin.Address.from(compressedPublicKeyBytes)

      const wallet: WalletData = { coin: "ethereum", type: "privateKey", uuid, name: finalNameInput, color: Color.all.indexOf(color), emoji, address, privateKey: zeroHexKey }

      await background.tryRequest<void>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [finalNameInput, zeroHexKey, uuid, color, emoji, background, close])

  const triedEncryptedPrivateKey = useAsyncReplaceMemo(async () => {
    return await Result.unthrow<Result<[string, string], Error>>(async t => {
      if (!finalNameInput)
        return new Err(new Panic())
      if (!secp256k1.utils.isValidPrivateKey(zeroHexKey.slice(2)))
        return new Err(new Panic())

      using privateKeyMemory = Base16.get().tryPadStartAndDecode(zeroHexKey.slice(2)).throw(t)
      const privateKeyBase64 = Base64.get().tryEncodePadded(privateKeyMemory).throw(t)

      const [ivBase64, cipherBase64] = await background.tryRequest<[string, string]>({
        method: "brume_encrypt",
        params: [privateKeyBase64]
      }).then(r => r.throw(t).throw(t))

      return new Ok([ivBase64, cipherBase64])
    })
  }, [finalNameInput, zeroHexKey, background])

  const [id, setId] = useState<Uint8Array>()

  useEffect(() => {
    setId(undefined)
  }, [zeroHexKey])

  const tryAddAuthenticated1 = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!finalNameInput)
        return new Err(new Panic())
      if (!secp256k1.utils.isValidPrivateKey(zeroHexKey.slice(2)))
        return new Err(new Panic())
      if (triedEncryptedPrivateKey == null)
        return new Err(new Panic())
      if (!confirm("Did you backup your private key?"))
        return Ok.void()

      const [_, cipherBase64] = triedEncryptedPrivateKey.throw(t)
      const cipher = Base64.get().tryDecodePadded(cipherBase64).throw(t).copyAndDispose()
      const id = await WebAuthnStorage.tryCreate(finalNameInput, cipher).then(r => r.throw(t))

      setId(id)

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [finalNameInput, zeroHexKey, triedEncryptedPrivateKey, uuid, color, emoji, background])

  const tryAddAuthenticated2 = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!finalNameInput)
        return new Err(new Panic())
      if (!secp256k1.utils.isValidPrivateKey(zeroHexKey.slice(2)))
        return new Err(new Panic())
      if (id == null)
        return new Err(new Panic())
      if (triedEncryptedPrivateKey == null)
        return new Err(new Panic())

      const privateKeyBytes = Base16.get().tryPadStartAndDecode(zeroHexKey.slice(2)).throw(t).copyAndDispose()

      const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)
      // const compressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, true)

      const address = Address.compute(uncompressedPublicKeyBytes)

      // const uncompressedBitcoinAddress = await Bitcoin.Address.from(uncompressedPublicKeyBytes)
      // const compressedBitcoinAddress = await Bitcoin.Address.from(compressedPublicKeyBytes)

      const [ivBase64, cipherBase64] = triedEncryptedPrivateKey.throw(t)
      const cipher = Base64.get().tryDecodePadded(cipherBase64).throw(t).copyAndDispose()
      const cipher2 = await WebAuthnStorage.tryGet(id).then(r => r.throw(t))

      if (!Bytes.equals(cipher, cipher2))
        return new Err(new WebAuthnStorageError())

      const idBase64 = Base64.get().tryEncodePadded(id).throw(t)
      const privateKey = { ivBase64, idBase64 }

      const wallet: WalletData = { coin: "ethereum", type: "authPrivateKey", uuid, name: finalNameInput, color: Color.all.indexOf(color), emoji, address, privateKey }

      await background.tryRequest<void>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [finalNameInput, zeroHexKey, id, triedEncryptedPrivateKey, uuid, color, emoji, background, close])

  const NameInput =
    <SimpleLabel>
      <div className="shrink-0">
        Name
      </div>
      <div className="w-4" />
      <SimpleInput
        placeholder="Holder"
        value={rawNameInput}
        onChange={onNameInputChange} />
    </SimpleLabel>

  const KeyInput =
    <div className="po-md flex flex-col bg-contrast rounded-xl">
      <div className="flex items-start">
        <div className="shrink-0">
          Private key
        </div>
        <div className="w-4" />
        <SimpleTextarea
          placeholder="0x"
          value={rawKeyInput}
          onChange={onKeyInputChange}
          rows={3} />
      </div>
      <div className="h-2" />
      <WideShrinkableContrastButton
        onClick={doGenerate.run}>
        <Outline.KeyIcon className="size-5" />
        Generate
      </WideShrinkableContrastButton>
    </div>

  const canAdd = useMemo(() => {
    if (!finalNameInput)
      return false
    if (!secp256k1.utils.isValidPrivateKey(zeroHexKey.slice(2)))
      return false
    return true
  }, [finalNameInput, zeroHexKey])

  const AddUnauthButton =
    <WideShrinkableContrastButton
      disabled={!canAdd}
      onClick={tryAddUnauthenticated.run}>
      <Outline.PlusIcon className="size-5" />
      Add without authentication
    </WideShrinkableContrastButton>

  const AddAuthButton1 =
    <WideShrinkableGradientButton
      color={color}
      disabled={!canAdd}
      onClick={tryAddAuthenticated1.run}>
      <Outline.LockClosedIcon className="size-5" />
      Add with authentication
    </WideShrinkableGradientButton>

  const AddAuthButton2 =
    <WideShrinkableGradientButton
      color={color}
      disabled={!canAdd}
      onClick={tryAddAuthenticated2.run}>
      <Outline.LockClosedIcon className="size-5" />
      Add with authentication (1/2)
    </WideShrinkableGradientButton>

  return <>
    <Dialog.Title>
      New wallet
    </Dialog.Title>
    <div className="h-4" />
    <div className="grow flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        {triedAddress.isOk() &&
          <SimpleWalletCard
            uuid={uuid}
            name={finalNameInput}
            emoji={emoji}
            address={triedAddress.get()}
            color={color} />}
        {triedAddress.isErr() &&
          <EmptyWalletCard />}
      </div>
    </div>
    <div className="h-2" />
    {NameInput}
    <div className="h-2" />
    {KeyInput}
    <div className="h-4" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      {AddUnauthButton}
      {id == null
        ? AddAuthButton1
        : AddAuthButton2}
    </div>
  </>
}


export function EmptyWalletCard(props: {}) {
  return <div className="po-md w-full aspect-video rounded-xl flex gap-2 justify-center items-center border border-contrast border-dashed hovered-or-clicked-or-focused:scale-105 !transition-transform" />
}