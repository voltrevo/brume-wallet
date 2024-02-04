import { Color } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useAsyncReplaceMemo } from "@/libs/react/memo";
import { useConstant } from "@/libs/react/ref";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { WebAuthnStorage, WebAuthnStorageError } from "@/libs/webauthn/webauthn";
import { WalletData } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { Base16 } from "@hazae41/base16";
import { Base64 } from "@hazae41/base64";
import { Bytes } from "@hazae41/bytes";
import { Address, ZeroHexString } from "@hazae41/cubane";
import { Panic, Result } from "@hazae41/result";
import { Secp256k1 } from "@hazae41/secp256k1";
import { secp256k1 } from "@noble/curves/secp256k1";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { SimpleInput, SimpleLabel, SimpleTextarea, WideShrinkableContrastButton, WideShrinkableGradientButton } from "../../actions/send";
import { RawWalletCard } from "../../card";

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

  const generateOrAlert = useCallback(() => Errors.runAndLogAndAlertSync(() => {
    using memory = Secp256k1.get().PrivateKey.tryRandom().unwrap().tryExport().unwrap()

    setRawKeyInput(`0x${Base16.get().encodeOrThrow(memory)}`)
  }), [])

  const triedAddress = useMemo(() => Result.runAndDoubleWrapSync(() => {
    using privateKeyMemory = Base16.get().padStartAndDecodeOrThrow(zeroHexKey.slice(2))
    using privateKey = Secp256k1.get().PrivateKey.tryImport(privateKeyMemory).unwrap()
    using publicKey = privateKey.tryGetPublicKey().unwrap()
    using uncompressedPublicKeyMemory = publicKey.tryExportUncompressed().unwrap()

    return Address.compute(uncompressedPublicKeyMemory.bytes)
  }), [zeroHexKey])

  const addUnauthenticatedOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    if (!finalNameInput)
      throw new Panic()
    if (!secp256k1.utils.isValidPrivateKey(zeroHexKey.slice(2)))
      throw new Panic()
    if (!confirm("Did you backup your private key?"))
      return

    const address = triedAddress.unwrap()
    const wallet: WalletData = { coin: "ethereum", type: "privateKey", uuid, name: finalNameInput, color: Color.all.indexOf(color), emoji, address, privateKey: zeroHexKey }

    await background.tryRequest<void>({
      method: "brume_createWallet",
      params: [wallet]
    }).then(r => r.unwrap().unwrap())

    close()
  }), [finalNameInput, zeroHexKey, uuid, color, emoji, background, close])

  const triedEncryptedPrivateKey = useAsyncReplaceMemo(() => Result.runAndWrap(async () => {
    if (!finalNameInput)
      throw new Panic()
    if (!secp256k1.utils.isValidPrivateKey(zeroHexKey.slice(2)))
      throw new Panic()

    using privateKeyMemory = Base16.get().padStartAndDecodeOrThrow(zeroHexKey.slice(2))
    const privateKeyBase64 = Base64.get().encodePaddedOrThrow(privateKeyMemory)

    const [ivBase64, cipherBase64] = await background.tryRequest<[string, string]>({
      method: "brume_encrypt",
      params: [privateKeyBase64]
    }).then(r => r.unwrap().unwrap())

    return [ivBase64, cipherBase64]
  }), [finalNameInput, zeroHexKey, background])

  const [id, setId] = useState<Uint8Array>()

  useEffect(() => {
    setId(undefined)
  }, [zeroHexKey])

  const addAuthenticatedOrAlert1 = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    if (!finalNameInput)
      throw new Panic()
    if (triedEncryptedPrivateKey == null)
      throw new Panic()
    if (!confirm("Did you backup your private key?"))
      return

    const [_, cipherBase64] = triedEncryptedPrivateKey.unwrap()
    const cipher = Base64.get().decodePaddedOrThrow(cipherBase64).copyAndDispose()
    const id = await WebAuthnStorage.createOrThrow(finalNameInput, cipher)

    setId(id)
  }), [finalNameInput, triedEncryptedPrivateKey])

  const addAuthenticatedOrAlert2 = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    if (id == null)
      throw new Panic()
    if (!finalNameInput)
      throw new Panic()
    if (triedEncryptedPrivateKey == null)
      throw new Panic()

    const address = triedAddress.unwrap()

    const [ivBase64, cipherBase64] = triedEncryptedPrivateKey.unwrap()

    using cipherMemory = Base64.get().decodePaddedOrThrow(cipherBase64)
    const cipherBytes = await WebAuthnStorage.getOrThrow(id)

    if (!Bytes.equals(cipherMemory.bytes, cipherBytes))
      throw new WebAuthnStorageError()

    const idBase64 = Base64.get().encodePaddedOrThrow(id)
    const privateKey = { ivBase64, idBase64 }

    const wallet: WalletData = { coin: "ethereum", type: "authPrivateKey", uuid, name: finalNameInput, color: Color.all.indexOf(color), emoji, address, privateKey }

    await background.tryRequest<void>({
      method: "brume_createWallet",
      params: [wallet]
    }).then(r => r.unwrap().unwrap())

    close()
  }), [id, finalNameInput, triedAddress, triedEncryptedPrivateKey, uuid, color, emoji, background, close])

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
        onClick={generateOrAlert}>
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
      onClick={addUnauthenticatedOrAlert.run}>
      <Outline.PlusIcon className="size-5" />
      Add without authentication
    </WideShrinkableContrastButton>

  const AddAuthButton1 =
    <WideShrinkableGradientButton
      color={color}
      disabled={!canAdd}
      onClick={addAuthenticatedOrAlert1.run}>
      <Outline.LockClosedIcon className="size-5" />
      Add with authentication
    </WideShrinkableGradientButton>

  const AddAuthButton2 =
    <WideShrinkableGradientButton
      color={color}
      disabled={!canAdd}
      onClick={addAuthenticatedOrAlert2.run}>
      <Outline.LockClosedIcon className="size-5" />
      Add with authentication (1/2)
    </WideShrinkableGradientButton>

  return <>
    <Dialog.Title>
      New wallet
    </Dialog.Title>
    <div className="h-4" />
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        {triedAddress.isOk() &&
          <div className="w-full aspect-video rounded-xl">
            <RawWalletCard
              uuid={uuid}
              name={finalNameInput}
              emoji={emoji}
              address={triedAddress.get()}
              color={color} />
          </div>}
        {triedAddress.isErr() &&
          <EmptyRectangularCard />}
      </div>
    </div>
    <div className="h-2" />
    <div className="flex-1 flex flex-col">
      <div className="grow" />
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
    </div>
  </>
}

export function EmptyRectangularCard(props: {}) {
  return <div className="po-md w-full aspect-video rounded-xl flex gap-2 justify-center items-center border border-contrast border-dashed hovered-or-clicked-or-focused:scale-105 !transition-transform" />
}