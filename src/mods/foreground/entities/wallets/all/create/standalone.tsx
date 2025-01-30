import { Color } from "@/libs/colors/colors";
import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { isSafariExtension } from "@/libs/platform/platform";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useAsyncReplaceMemo } from "@/libs/react/memo";
import { useConstant } from "@/libs/react/ref";
import { WideClickableContrastButton, WideClickableGradientButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { ContrastLabel } from "@/libs/ui/label";
import { randomUUID } from "@/libs/uuid/uuid";
import { WalletData } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { Base16 } from "@hazae41/base16";
import { Base64 } from "@hazae41/base64";
import { Bytes } from "@hazae41/bytes";
import { Address, ZeroHexAsInteger } from "@hazae41/cubane";
import { useCloseContext } from "@hazae41/react-close-context";
import { Panic, Result } from "@hazae41/result";
import { Secp256k1 } from "@hazae41/secp256k1";
import { WebAuthnStorage } from "@hazae41/webauthnstorage";
import { secp256k1 } from "@noble/curves/secp256k1";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { SimpleInput, SimpleTextarea } from "../../actions/send";
import { RawWalletCard } from "../../card";

export function StandaloneWalletCreatorDialog(props: {}) {
  const close = useCloseContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const uuid = useConstant(() => randomUUID())

  const modhash = useModhash(uuid)
  const color = Color.get(modhash)

  const [rawNameInput = "", setRawNameInput] = useState<string>()

  const defNameInput = useDeferredValue(rawNameInput)

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const [rawKeyInput = "", setRawKeyInput] = useState<string>()

  const defKeyInput = useDeferredValue(rawKeyInput)
  const zeroHexKey = ZeroHexAsInteger.fromOrThrow(defKeyInput)

  const onKeyInputChange = useTextAreaChange(e => {
    setRawKeyInput(e.currentTarget.value)
  }, [])

  const generateOrAlert = useCallback(() => Errors.runAndLogAndAlertSync(() => {
    using signing = Secp256k1.get().getOrThrow().SigningKey.randomOrThrow()
    using memory = signing.exportOrThrow()

    setRawKeyInput(`0x${Base16.get().getOrThrow().encodeOrThrow(memory)}`)
  }), [])

  const triedAddress = useMemo(() => Result.runAndDoubleWrapSync(() => {
    using privateKeyMemory = Base16.get().getOrThrow().padStartAndDecodeOrThrow(zeroHexKey.slice(2))
    using privateKey = Secp256k1.get().getOrThrow().SigningKey.importOrThrow(privateKeyMemory)
    using publicKey = privateKey.getVerifyingKeyOrThrow()
    using uncompressedPublicKeyMemory = publicKey.exportUncompressedOrThrow()

    return Address.computeOrThrow(uncompressedPublicKeyMemory.bytes)
  }), [zeroHexKey])

  const addUnauthenticatedOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (!defNameInput)
      throw new Panic()
    if (!secp256k1.utils.isValidPrivateKey(zeroHexKey.slice(2)))
      throw new Panic()
    if (!isSafariExtension() && confirm("Did you backup your private key?") === false)
      return

    const address = triedAddress.getOrThrow()
    const wallet: WalletData = { coin: "ethereum", type: "privateKey", uuid, name: defNameInput, color: Color.all.indexOf(color), address, privateKey: zeroHexKey }

    await background.requestOrThrow<void>({
      method: "brume_createWallet",
      params: [wallet]
    }).then(r => r.getOrThrow())

    close()
  }), [defNameInput, zeroHexKey, uuid, color, background, close])

  const triedEncryptedPrivateKey = useAsyncReplaceMemo(() => Result.runAndWrap(async () => {
    if (!defNameInput)
      throw new Panic()
    if (!secp256k1.utils.isValidPrivateKey(zeroHexKey.slice(2)))
      throw new Panic()

    using privateKeyMemory = Base16.get().getOrThrow().padStartAndDecodeOrThrow(zeroHexKey.slice(2))
    const privateKeyBase64 = Base64.get().getOrThrow().encodePaddedOrThrow(privateKeyMemory)

    const [ivBase64, cipherBase64] = await background.requestOrThrow<[string, string]>({
      method: "brume_encrypt",
      params: [privateKeyBase64]
    }).then(r => r.getOrThrow())

    return [ivBase64, cipherBase64]
  }), [defNameInput, zeroHexKey, background])

  const [id, setId] = useState<Uint8Array>()

  useEffect(() => {
    setId(undefined)
  }, [zeroHexKey])

  const addAuthenticatedOrAlert1 = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (!defNameInput)
      throw new Panic()
    if (triedEncryptedPrivateKey == null)
      throw new Panic()
    if (!isSafariExtension() && confirm("Did you backup your private key?") === false)
      return

    const [_, cipherBase64] = triedEncryptedPrivateKey.getOrThrow()

    using cipher = Base64.get().getOrThrow().decodePaddedOrThrow(cipherBase64)

    const id = await WebAuthnStorage.createOrThrow(defNameInput, cipher.bytes)

    setId(id)
  }), [defNameInput, triedEncryptedPrivateKey])

  const addAuthenticatedOrAlert2 = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (id == null)
      throw new Panic()
    if (!defNameInput)
      throw new Panic()
    if (triedEncryptedPrivateKey == null)
      throw new Panic()

    const address = triedAddress.getOrThrow()

    const [ivBase64, cipherBase64] = triedEncryptedPrivateKey.getOrThrow()

    using cipherMemory = Base64.get().getOrThrow().decodePaddedOrThrow(cipherBase64)
    const cipherBytes = await WebAuthnStorage.getOrThrow(id)

    if (!Bytes.equals(cipherMemory.bytes, cipherBytes))
      throw new Error(`Corrupt storage`)

    const idBase64 = Base64.get().getOrThrow().encodePaddedOrThrow(id)

    const privateKey = { ivBase64, idBase64 }

    const wallet: WalletData = { coin: "ethereum", type: "authPrivateKey", uuid, name: defNameInput, color: Color.all.indexOf(color), address, privateKey }

    await background.requestOrThrow<void>({
      method: "brume_createWallet",
      params: [wallet]
    }).then(r => r.getOrThrow())

    close()
  }), [id, defNameInput, triedAddress, triedEncryptedPrivateKey, uuid, color, background, close])

  const NameInput =
    <ContrastLabel>
      <div className="flex-none">
        {Locale.get(Locale.Name, locale)}
      </div>
      <div className="w-4" />
      <SimpleInput
        placeholder="My wallet"
        value={rawNameInput}
        onChange={onNameInputChange} />
    </ContrastLabel>

  const KeyInput =
    <div className="po-2 flex flex-col bg-default-contrast rounded-xl">
      <div className="flex items-start">
        <div className="flex-none">
          {Locale.get(Locale.PrivateKey, locale)}
        </div>
        <div className="w-4" />
        <SimpleTextarea
          placeholder="0x"
          value={rawKeyInput}
          onChange={onKeyInputChange}
          rows={3} />
      </div>
      <div className="h-2" />
      <WideClickableContrastButton
        onClick={generateOrAlert}>
        <Outline.KeyIcon className="size-5" />
        Generate
      </WideClickableContrastButton>
    </div>

  const error = useMemo(() => {
    if (!defNameInput)
      return Locale.get(Locale.NameRequired, locale)
    if (!secp256k1.utils.isValidPrivateKey(zeroHexKey.slice(2)))
      return "Please enter a valid private key"
    return
  }, [locale, defNameInput, zeroHexKey])

  const AddUnauthButton =
    <WideClickableContrastButton
      disabled={error != null || addUnauthenticatedOrAlert.loading}
      onClick={addUnauthenticatedOrAlert.run}>
      <Outline.PlusIcon className="size-5" />
      {error || "Add without authentication"}
    </WideClickableContrastButton>

  const AddAuthButton1 =
    <WideClickableGradientButton
      color={color}
      disabled={error != null || addAuthenticatedOrAlert1.loading}
      onClick={addAuthenticatedOrAlert1.run}>
      <Outline.LockClosedIcon className="size-5" />
      {error || "Add with authentication"}
    </WideClickableGradientButton>

  const AddAuthButton2 =
    <WideClickableGradientButton
      color={color}
      disabled={error != null || addAuthenticatedOrAlert2.loading}
      onClick={addAuthenticatedOrAlert2.run}>
      <Outline.LockClosedIcon className="size-5" />
      {error || "Add with authentication (1/2)"}
    </WideClickableGradientButton>

  return <>
    <Dialog.Title>
      {Locale.get(Locale.NewWallet, locale)}
    </Dialog.Title>
    <div className="h-4" />
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        {triedAddress.isOk() &&
          <div className="w-full aspect-video rounded-xl">
            <RawWalletCard
              uuid={uuid}
              name={defNameInput}
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
  return <div className="po-2 w-full aspect-video rounded-xl flex gap-2 justify-center items-center border border-default-contrast border-dashed hovered-or-clicked-or-focused:scale-105 !transition-transform" />
}