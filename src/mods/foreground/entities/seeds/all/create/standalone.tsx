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
import { SeedData } from "@/mods/background/service_worker/entities/seeds/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { Base64 } from "@hazae41/base64";
import { Bytes } from "@hazae41/bytes";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { generateMnemonic, mnemonicToEntropy, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { SimpleInput, SimpleLabel, SimpleTextarea, WideShrinkableContrastButton, WideShrinkableGradientButton } from "../../../wallets/actions/send";
import { RawSeedCard } from "../../card";

export function StandaloneSeedCreatorDialog(props: {}) {
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

  const [rawPhraseInput = "", setRawPhraseInput] = useState<string>()

  const defPhraseInput = useDeferredValue(rawPhraseInput)

  const onPhraseInputChange = useTextAreaChange(e => {
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
      if (!finalNameInput)
        return new Err(new Panic())
      if (!defPhraseInput)
        return new Err(new Panic())
      if (!confirm("Did you backup your seed phrase?"))
        return Ok.void()

      const seed: SeedData = { type: "mnemonic", uuid, name: finalNameInput, color: Color.all.indexOf(color), emoji, mnemonic: defPhraseInput }

      await background.tryRequest<void>({
        method: "brume_createSeed",
        params: [seed]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [finalNameInput, defPhraseInput, uuid, color, emoji, background, close])

  const triedEncryptedPhrase = useAsyncReplaceMemo(async () => {
    return await Result.unthrow<Result<[string, string], Error>>(async t => {
      if (!finalNameInput)
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
  }, [finalNameInput, defPhraseInput, background])

  const [id, setId] = useState<Uint8Array>()

  useEffect(() => {
    setId(undefined)
  }, [defPhraseInput])

  const tryAddAuthenticated1 = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!finalNameInput)
        return new Err(new Panic())
      if (!defPhraseInput)
        return new Err(new Panic())
      if (triedEncryptedPhrase == null)
        return new Err(new Panic())
      if (!confirm("Did you backup your seed phrase?"))
        return Ok.void()

      const [_, cipherBase64] = triedEncryptedPhrase.throw(t)
      const cipher = Base64.get().tryDecodePadded(cipherBase64).throw(t).copyAndDispose()
      const id = await WebAuthnStorage.tryCreate(finalNameInput, cipher).then(r => r.throw(t))

      setId(id)

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [finalNameInput, defPhraseInput, triedEncryptedPhrase, uuid, color, emoji, background])

  const tryAddAuthenticated2 = useAsyncUniqueCallback(async () => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (!finalNameInput)
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

      const seed: SeedData = { type: "authMnemonic", uuid, name: finalNameInput, color: Color.all.indexOf(color), emoji, mnemonic }

      await background.tryRequest<void>({
        method: "brume_createSeed",
        params: [seed]
      }).then(r => r.throw(t).throw(t))

      close()

      return Ok.void()
    }).then(Results.logAndAlert)
  }, [finalNameInput, defPhraseInput, id, triedEncryptedPhrase, uuid, color, emoji, background, close])

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

  const PhraseInput =
    <div className="po-md flex flex-col bg-contrast rounded-xl">
      <div className="flex items-start">
        <div className="shrink-0">
          Seed phrase
        </div>
        <div className="w-4" />
        <SimpleTextarea
          placeholder="candy climb cloth fetch crack miss gift direct then fork prevent already increase slam code"
          value={rawPhraseInput}
          onChange={onPhraseInputChange}
          rows={5} />
      </div>
      <div className="h-2" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideShrinkableContrastButton
          onClick={doGenerate12.run}>
          <Outline.KeyIcon className="size-5" />
          Generate 12 words
        </WideShrinkableContrastButton>
        <WideShrinkableContrastButton
          onClick={doGenerate24.run}>
          <Outline.KeyIcon className="size-5" />
          Generate 24 words
        </WideShrinkableContrastButton>
      </div>
    </div>

  const canAdd = useMemo(() => {
    if (!finalNameInput)
      return false
    if (!validateMnemonic(defPhraseInput, wordlist))
      return false
    return true
  }, [finalNameInput, defPhraseInput])

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
      New seed
    </Dialog.Title>
    <div className="h-4" />
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="w-full aspect-video rounded-xl">
          <RawSeedCard
            name={finalNameInput}
            emoji={emoji}
            color={color} />
        </div>
      </div>
    </div>
    <div className="h-2" />
    <div className="flex-1 flex flex-col">
      <div className="grow" />
      {NameInput}
      <div className="h-2" />
      {PhraseInput}
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