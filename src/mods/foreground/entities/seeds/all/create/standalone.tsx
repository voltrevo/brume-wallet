import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useTextAreaChange } from "@/libs/react/events";
import { useAsyncReplaceMemo } from "@/libs/react/memo";
import { useConstant } from "@/libs/react/ref";
import { Results } from "@/libs/results/results";
import { Button } from "@/libs/ui/button";
import { Dialog, useDialogContext } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { Textarea } from "@/libs/ui/textarea";
import { WebAuthnStorage, WebAuthnStorageError } from "@/libs/webauthn/webauthn";
import { SeedData } from "@/mods/background/service_worker/entities/seeds/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { Base64 } from "@hazae41/base64";
import { Bytes } from "@hazae41/bytes";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { generateMnemonic, mnemonicToEntropy, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { WalletAvatar } from "../../../wallets/avatar";

export function StandaloneSeedCreatorDialog(props: {}) {
  const { close } = useDialogContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const uuid = useConstant(() => crypto.randomUUID())

  const modhash = useModhash(uuid)
  const color = Colors.mod(modhash)
  const emoji = Emojis.get(modhash)

  const [rawNameInput = "", setRawNameInput] = useState<string>()

  const defNameInput = useDeferredValue(rawNameInput)

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const [rawPhraseInput = "", setRawPhraseInput] = useState<string>()

  const defPhraseInput = useDeferredValue(rawPhraseInput)

  const onInputChange = useTextAreaChange(e => {
    setRawPhraseInput(e.currentTarget.value)
  }, [])

  const doGenerate12 = useAsyncUniqueCallback(async () => {
    setRawPhraseInput(generateMnemonic(wordlist, 128))
  }, [])

  const doGenerate24 = useAsyncUniqueCallback(async () => {
    setRawPhraseInput(generateMnemonic(wordlist, 256))
  }, [])

  const tryAddUnauthenticated = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!defNameInput)
        return new Err(new Panic())
      if (!defPhraseInput)
        return new Err(new Panic())
      if (!confirm("Did you backup your seed phrase?"))
        return Ok.void()

      const seed: SeedData = { type: "mnemonic", uuid, name: defNameInput, color, emoji, mnemonic: defPhraseInput }

      await background.tryRequest<void>({
        method: "brume_createSeed",
        params: [seed]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [defNameInput, defPhraseInput, uuid, color, emoji, background, close])

  const triedEncryptedPhrase = useAsyncReplaceMemo(async () => {
    return await Result.unthrow<Result<[string, string], Error>>(async t => {
      if (!defNameInput)
        return new Err(new Panic())
      if (!defPhraseInput)
        return new Err(new Panic())

      try {
        const entropyBytes = mnemonicToEntropy(defPhraseInput, wordlist)
        const entropyBase64 = Base64.get().tryEncodePadded(entropyBytes).throw(t)

        const [ivBase64, cipherBase64] = await background.tryRequest<[string, string]>({
          method: "brume_encrypt",
          params: [entropyBase64]
        }).then(r => r.throw(t).throw(t))

        return new Ok([ivBase64, cipherBase64])
      } catch (e: unknown) {
        return new Err(new Panic())
      }
    })
  }, [defNameInput, defPhraseInput, background])

  const [id, setId] = useState<Uint8Array>()

  useEffect(() => {
    setId(undefined)
  }, [defPhraseInput])

  const tryAddAuthenticated1 = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!defNameInput)
        return new Err(new Panic())
      if (!defPhraseInput)
        return new Err(new Panic())
      if (triedEncryptedPhrase == null)
        return new Err(new Panic())
      if (!confirm("Did you backup your seed phrase?"))
        return Ok.void()

      const [_, cipherBase64] = triedEncryptedPhrase.throw(t)
      const cipher = Base64.get().tryDecodePadded(cipherBase64).throw(t).copyAndDispose()
      const id = await WebAuthnStorage.tryCreate(defNameInput, cipher).then(r => r.throw(t))

      setId(id)

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [defNameInput, defPhraseInput, triedEncryptedPhrase, uuid, color, emoji, background])

  const tryAddAuthenticated2 = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!defNameInput)
        return new Err(new Panic())
      if (!defPhraseInput)
        return new Err(new Panic())
      if (id == null)
        return new Err(new Panic())
      if (triedEncryptedPhrase == null)
        return new Err(new Panic())

      const [ivBase64, cipherBase64] = triedEncryptedPhrase.throw(t)

      using cipherSlice = Base64.get().tryDecodePadded(cipherBase64).throw(t)
      const cipherBytes2 = await WebAuthnStorage.tryGet(id).then(r => r.throw(t))

      if (!Bytes.equals(cipherSlice.bytes, cipherBytes2))
        return new Err(new WebAuthnStorageError())

      const idBase64 = Base64.get().tryEncodePadded(id).throw(t)
      const mnemonic = { ivBase64, idBase64 }

      const seed: SeedData = { type: "authMnemonic", uuid, name: defNameInput, color, emoji, mnemonic }

      await background.tryRequest<void>({
        method: "brume_createSeed",
        params: [seed]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [defNameInput, defPhraseInput, id, triedEncryptedPhrase, uuid, color, emoji, background, close])

  const NameInput =
    <div className="flex items-stretch gap-2">
      <div className="shrink-0">
        <WalletAvatar className="size-12 text-2xl"
          colorIndex={color}
          emoji={emoji} />
      </div>
      <Input.Contrast className="w-full"
        placeholder="Enter a name"
        value={rawNameInput}
        onChange={onNameInputChange} />
    </div>

  const PhraseInput =
    <Textarea.Contrast className="w-full resize-none"
      placeholder="Enter your seed phrase"
      value={rawPhraseInput}
      onChange={onInputChange}
      rows={4} />

  const Generate12Button =
    <Button.Contrast className="flex-1 whitespace-nowrap po-md"
      onClick={doGenerate12.run}>
      <div className={`${Button.Shrinker.className}`}>
        <Outline.KeyIcon className="size-5" />
        Generate 12 random words
      </div>
    </Button.Contrast>

  const Generate24Button =
    <Button.Gradient className="flex-1 whitespace-nowrap po-md"
      colorIndex={color}
      onClick={doGenerate24.run}>
      <div className={`${Button.Shrinker.className}`}>
        <Outline.KeyIcon className="size-5" />
        Generate 24 random words
      </div>
    </Button.Gradient>

  const canAdd = useMemo(() => {
    if (!defNameInput)
      return false
    if (!validateMnemonic(defPhraseInput, wordlist))
      return false
    return true
  }, [defNameInput, defPhraseInput])

  const AddUnauthButton =
    <Button.Contrast className="flex-1 whitespace-nowrap po-md"
      disabled={!canAdd}
      onClick={tryAddUnauthenticated.run}>
      <div className={`${Button.Shrinker.className}`}>
        <Outline.PlusIcon className="size-5" />
        Add without authentication
      </div>
    </Button.Contrast>

  const AddAuthButton1 =
    <Button.Gradient className="flex-1 whitespace-nowrap po-md"
      colorIndex={color}
      disabled={!canAdd}
      onClick={tryAddAuthenticated1.run}>
      <div className={`${Button.Shrinker.className}`}>
        <Outline.LockClosedIcon className="size-5" />
        Add with authentication
      </div>
    </Button.Gradient>

  const AddAuthButton2 =
    <Button.Gradient className="flex-1 whitespace-nowrap po-md"
      colorIndex={color}
      disabled={!canAdd}
      onClick={tryAddAuthenticated2.run}>
      <div className={`${Button.Shrinker.className}`}>
        <Outline.LockClosedIcon className="size-5" />
        Add with authentication (1/2)
      </div>
    </Button.Gradient>

  return <>
    <Dialog.Title close={close}>
      New seed
    </Dialog.Title>
    <div className="h-2" />
    {NameInput}
    <div className="h-8" />
    {PhraseInput}
    <div className="flex items-center flex-wrap-reverse gap-2">
      {Generate12Button}
      {Generate24Button}
    </div>
    <div className="h-8" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      {AddUnauthButton}
      {id == null
        ? AddAuthButton1
        : AddAuthButton2}
    </div>
  </>
}