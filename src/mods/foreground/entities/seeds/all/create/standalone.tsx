import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
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
import { SeedData } from "@/mods/background/service_worker/entities/seeds/data";
import { useBackground } from "@/mods/foreground/background/context";
import { Bytes } from "@hazae41/bytes";
import { Err, Ok, Panic, Result } from "@hazae41/result";
import { generateMnemonic, mnemonicToEntropy, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { WalletAvatar } from "../../../wallets/avatar";

export function StandaloneSeedCreatorDialog(props: CloseProps) {
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
        const entropyBase64 = Bytes.toBase64(entropyBytes)

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

      const [_, cipherBase64] = triedEncryptedPhrase.throw(t)
      const cipher = Bytes.fromBase64(cipherBase64)
      const id = await WebAuthnStorage.create(defNameInput, cipher).then(r => r.throw(t))

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
      const cipher = Bytes.fromBase64(cipherBase64)
      const cipher2 = await WebAuthnStorage.get(id).then(r => r.throw(t))

      if (!Bytes.equals(cipher, cipher2))
        return new Err(new WebAuthnStorageError())

      const idBase64 = Bytes.toBase64(id)
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
        <WalletAvatar className="s-5xl text-2xl"
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
      <Button.Shrink>
        <Outline.KeyIcon className="s-sm" />
        Generate 12 random words
      </Button.Shrink>
    </Button.Contrast>

  const Generate24Button =
    <Button.Gradient className="flex-1 whitespace-nowrap po-md"
      colorIndex={color}
      onClick={doGenerate24.run}>
      <Button.Shrink>
        <Outline.KeyIcon className="s-sm" />
        Generate 24 random words
      </Button.Shrink>
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
  </Dialog>
}