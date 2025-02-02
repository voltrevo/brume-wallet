import { Color } from "@/libs/colors/colors";
import { Errors, UIError } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { WideClickableGradientButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { ContrastLabel } from "@/libs/ui/label";
import { randomUUID } from "@/libs/uuid/uuid";
import { Wallet, WalletData } from "@/mods/background/service_worker/entities/wallets/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { SeedRef } from "@/mods/universal/entities/seeds";
import { Address, ZeroHexString } from "@hazae41/cubane";
import { Ledger } from "@hazae41/ledger";
import { Option } from "@hazae41/option";
import { useCloseContext } from "@hazae41/react-close-context";
import { Panic, Result } from "@hazae41/result";
import { secp256k1 } from "@noble/curves/secp256k1";
import { HDKey } from "@scure/bip32";
import { mnemonicToSeed } from "@scure/bip39";
import { SyntheticEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { SeedInstance } from "../../../seeds/all/helpers";
import { useSeedDataContext } from "../../../seeds/context";
import { SimpleInput } from "../../actions/send";
import { EmptyRectangularCard } from "./standalone";

export function SeededWalletCreatorDialog(props: {}) {
  const close = useCloseContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()
  const seedData = useSeedDataContext().getOrThrow()

  const uuid = useConstant(() => randomUUID())

  const modhash = useModhash(uuid)
  const color = Color.get(modhash)

  const [rawNameInput = "", setRawNameInput] = useState<string>()

  const defNameInput = useDeferredValue(rawNameInput)

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const [rawPathInput = "", setRawPathInput] = useState<string>()

  const defPathInput = useDeferredValue(rawPathInput)

  const onPathInputChange = useInputChange(e => {
    setRawPathInput(e.currentTarget.value)
  }, [])

  const [rawDerivation, setRawDerivation] = useState<string>("eth-metamask")

  const onDerivationChange = useCallback((e: SyntheticEvent<HTMLSelectElement>) => {
    setRawDerivation(e.currentTarget.value)
  }, [])

  const [rawIndexInput = "", setRawIndexInput] = useState<string>("0")

  const defIndexInput = useDeferredValue(rawIndexInput)

  const onIndexInputChange = useInputChange(e => {
    setRawIndexInput(e.currentTarget.value)
  }, [])

  useEffect(() => {
    if (rawDerivation === "custom")
      return setRawPathInput(undefined)

    const i = Number(defIndexInput).toFixed()

    if (rawDerivation === "eth-metamask")
      return setRawPathInput(`m/44'/60'/0'/0/${i}`)
    if (rawDerivation === "eth-ledger")
      return setRawPathInput(`m/44'/60'/${i}'/0/0`)
    if (rawDerivation === "etc-metamask")
      return setRawPathInput(`m/44'/61'/0'/0/${i}`)
    if (rawDerivation === "etc-ledger")
      return setRawPathInput(`m/44'/61'/${i}'/0/0`)
  }, [rawDerivation, defIndexInput])

  const error = useMemo(() => {
    if (!defNameInput)
      return Locale.get(Locale.NameRequired, locale)
    if (!defPathInput)
      return Locale.get(Locale.ValidDerivationPathRequired, locale)
    return
  }, [locale, defNameInput, defPathInput])

  const addOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (!defNameInput)
      throw new Panic()

    if (seedData.type === "ledger") {
      const device = await Result.runAndWrap(async () => {
        return await Ledger.USB.getOrRequestDeviceOrThrow()
      }).then(r => r.mapErrSync(cause => {
        return new UIError(`Could not find device`, { cause })
      }).getOrThrow())

      const connector = await Result.runAndWrap(async () => {
        return await Ledger.USB.connectOrThrow(device)
      }).then(r => r.mapErrSync(cause => {
        return new UIError(`Could not connect to the device`, { cause })
      }).getOrThrow())

      const { address } = await Result.runAndWrap(() => {
        return Ledger.Ethereum.getAddressOrThrow(connector, defPathInput.slice(2))
      }).then(r => r.mapErrSync(cause => {
        return new UIError(`Could not get the address of the device`, { cause })
      }).getOrThrow())

      if (!ZeroHexString.String.is(address))
        throw new UIError(`Could not get the address of the device`)

      const seed = SeedRef.from(seedData)

      const wallet: WalletData = { coin: "ethereum", type: "seeded", uuid, name: defNameInput, color: Color.all.indexOf(color), address, seed, path: defPathInput }

      await background.requestOrThrow<Wallet[]>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.mapErrSync(cause => {
        return new UIError(`Could not create the wallet`, { cause })
      }).getOrThrow())

    } else {
      const instance = await SeedInstance.createOrThrow(seedData, background)

      const mnemonic = await Result.runAndWrap(async () => {
        return await instance.getMnemonicOrThrow(background)
      }).then(r => r.mapErrSync(cause => {
        return new UIError(`Could not get mnemonic`, { cause })
      }).getOrThrow())

      const masterSeed = await Result.runAndWrap(async () => {
        return await mnemonicToSeed(mnemonic)
      }).then(r => r.getOrThrow())

      const root = Result.runAndWrapSync(() => {
        return HDKey.fromMasterSeed(masterSeed)
      }).getOrThrow()

      const child = Result.runAndWrapSync(() => {
        return root.derive(defPathInput)
      }).mapErrSync((cause) => {
        return new UIError(`Invalid derivation path`, { cause })
      }).getOrThrow()

      const privateKeyBytes = Option.wrap(child.privateKey).getOrThrow()
      const uncompressedPublicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false)

      const address = Address.computeOrThrow(uncompressedPublicKeyBytes)
      const seed = SeedRef.from(seedData)

      const wallet: WalletData = { coin: "ethereum", type: "seeded", uuid, name: defNameInput, color: Color.all.indexOf(color), address, seed, path: defPathInput }

      await background.requestOrThrow<Wallet[]>({
        method: "brume_createWallet",
        params: [wallet]
      }).then(r => r.mapErrSync(cause => {
        return new UIError(`Could not create the wallet`, { cause })
      }).getOrThrow())
    }

    close()
  }), [defNameInput, defPathInput, seedData, defPathInput, uuid, color, background, close])

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

  const PathInput =
    <ContrastLabel>
      <div className="flex-none">
        {Locale.get(Locale.Path, locale)}
      </div>
      <div className="w-4" />
      <SimpleInput
        placeholder="m/44'/60'/0'/0/0"
        value={rawPathInput}
        onChange={onPathInputChange} />
    </ContrastLabel>

  const IndexInput =
    <ContrastLabel>
      <div className="flex-none">
        {Locale.get(Locale.Number, locale)}
      </div>
      <div className="w-4" />
      <SimpleInput
        placeholder="0"
        type="number"
        min={0}
        value={rawIndexInput}
        onChange={onIndexInputChange} />
    </ContrastLabel>

  const AddButon =
    <WideClickableGradientButton
      color={color}
      disabled={error != null || addOrAlert.loading}
      onClick={addOrAlert.run}>
      <Outline.PlusIcon className="size-5" />
      {error || Locale.get(Locale.Add, locale)}
    </WideClickableGradientButton>

  return <>
    <Dialog.Title>
      {Locale.get(Locale.NewWallet, locale)}
    </Dialog.Title>
    <div className="h-4" />
    <div className="grow flex flex-col items-center justify-center h-[300px]">
      <div className="w-full max-w-sm">
        <EmptyRectangularCard />
      </div>
    </div>
    <div className="h-2" />
    <div className="grow flex flex-col">
      <div className="grow" />
      {NameInput}
      <div className="h-2" />
      <ContrastLabel>
        <div className="flex-none">
          {Locale.get(Locale.Mode, locale)}
        </div>
        <div className="w-4" />
        <select className="w-full bg-transparent outline-none text-ellipsis overflow-x-hidden appearance-none"
          value={rawDerivation}
          onChange={onDerivationChange}>
          <option value="eth-metamask">
            {Locale.get({
              en: `Ethereum — MetaMask-like — m/44'/60'/0'/0/x`,
              zh: `以太坊 — MetaMask 风格 — m/44'/60'/0'/0/x`,
              hi: `इथेरियम — मेटामास्क जैसा — m/44'/60'/0'/0/x`,
              es: `Ethereum — Estilo MetaMask — m/44'/60'/0'/0/x`,
              ar: `إيثريوم — مثل MetaMask — m/44'/60'/0'/0/x`,
              fr: `Ethereum — Style MetaMask — m/44'/60'/0'/0/x`,
              de: `Ethereum — MetaMask-ähnlich — m/44'/60'/0'/0/x`,
              ru: `Ethereum — похоже на MetaMask — m/44'/60'/0'/0/x`,
              pt: `Ethereum — Estilo MetaMask — m/44'/60'/0'/0/x`,
              ja: `Ethereum — MetaMask のよう — m/44'/60'/0'/0/x`,
              pa: `ਇਥੇਰੀਅਮ — ਮੇਟਾਮਾਸਕ ਜਿਵੇਂ — m/44'/60'/0'/0/x`,
              bn: `ইথেরিয়াম — মেটামাস্ক মত — m/44'/60'/0'/0/x`,
              id: `Ethereum — Seperti MetaMask — m/44'/60'/0'/0/x`,
              ur: `ایتھیریم — میٹا ماسک جیسا — m/44'/60'/0'/0/x`,
              ms: `Ethereum — Seperti MetaMask — m/44'/60'/0'/0/x`,
              it: `Ethereum — Stile MetaMask — m/44'/60'/0'/0/x`,
              tr: `Ethereum — MetaMask Benzeri — m/44'/60'/0'/0/x`,
              ta: `எதீரியம் — மெடாமாஸ்க் போன்ற — m/44'/60'/0'/0/x`,
              te: `ఎథిరియం — మెటామాస్క్ లాంటి — m/44'/60'/0'/0/x`,
              ko: `이더리움 — MetaMask와 유사 — m/44'/60'/0'/0/x`,
              vi: `Ethereum — Giống MetaMask — m/44'/60'/0'/0/x`,
              pl: `Ethereum — Podobnie jak MetaMask — m/44'/60'/0'/0/x`,
              ro: `Ethereum — Asemănător cu MetaMask — m/44'/60'/0'/0/x`,
              nl: `Ethereum — MetaMask-achtig — m/44'/60'/0'/0/x`,
              el: `Ethereum — Στυλ MetaMask — m/44'/60'/0'/0/x`,
              th: `Ethereum — แบบ MetaMask — m/44'/60'/0'/0/x`,
              cs: `Ethereum — Podobné jako MetaMask — m/44'/60'/0'/0/x`,
              hu: `Ethereum — MetaMask-szerű — m/44'/60'/0'/0/x`,
              sv: `Ethereum — MetaMask-liknande — m/44'/60'/0'/0/x`,
              da: `Ethereum — MetaMask-lignende — m/44'/60'/0'/0/x`,
            }, locale)}
          </option>
          <option value="eth-ledger">
            {Locale.get({
              en: `Ethereum — Ledger-like - m/44'/60'/x'/0/0`,
              zh: `以太坊 — 类似 Ledger — m/44'/60'/x'/0/0`,
              hi: `इथेरियम — लेजर जैसा — m/44'/60'/x'/0/0`,
              es: `Ethereum — Estilo Ledger — m/44'/60'/x'/0/0`,
              ar: `إيثريوم — مثل ليدجر — m/44'/60'/x'/0/0`,
              fr: `Ethereum — Style Ledger — m/44'/60'/x'/0/0`,
              de: `Ethereum — Ledger-ähnlich — m/44'/60'/x'/0/0`,
              ru: `Ethereum — похоже на Ledger — m/44'/60'/x'/0/0`,
              pt: `Ethereum — Estilo Ledger — m/44'/60'/x'/0/0`,
              ja: `Ethereum — Ledger のよう — m/44'/60'/x'/0/0`,
              pa: `ਇਥੇਰੀਅਮ — ਲੈਜ਼ਰ ਜਿਵੇਂ — m/44'/60'/x'/0/0`,
              bn: `ইথেরিয়াম — লেজার মত — m/44'/60'/x'/0/0`,
              id: `Ethereum — Seperti Ledger — m/44'/60'/x'/0/0`,
              ur: `ایتھیریم — لیجر جیسا — m/44'/60'/x'/0/0`,
              ms: `Ethereum — Seperti Ledger — m/44'/60'/x'/0/0`,
              it: `Ethereum — Stile Ledger — m/44'/60'/x'/0/0`,
              tr: `Ethereum — Ledger Benzeri — m/44'/60'/x'/0/0`,
              ta: `எதீரியம் — லெஜர் போன்ற — m/44'/60'/x'/0/0`,
              te: `ఎథిరియం — లెజర్ లాంటి — m/44'/60'/x'/0/0`,
              ko: `이더리움 — Ledger와 유사 — m/44'/60'/x'/0/0`,
              vi: `Ethereum — Giống Ledger — m/44'/60'/x'/0/0`,
              pl: `Ethereum — Podobnie jak Ledger — m/44'/60'/x'/0/0`,
              ro: `Ethereum — Asemănător cu Ledger — m/44'/60'/x'/0/0`,
              nl: `Ethereum — Ledger-achtig — m/44'/60'/x'/0/0`,
              el: `Ethereum — Στυλ Ledger — m/44'/60'/x'/0/0`,
              th: `Ethereum — แบบ Ledger — m/44'/60'/x'/0/0`,
              cs: `Ethereum — Podobné jako Ledger — m/44'/60'/x'/0/0`,
              hu: `Ethereum — Ledger-szerű — m/44'/60'/x'/0/0`,
              sv: `Ethereum — Ledger-liknande — m/44'/60'/x'/0/0`,
              da: `Ethereum — Ledger-lignende — m/44'/60'/x'/0/0`,
            }, locale)}
          </option>
          <option value="etc-metamask">
            {Locale.get({
              en: `Ethereum Classic — MetaMask-like — m/44'/61'/0'/0/x`,
              zh: `以太经典 — MetaMask 风格 — m/44'/61'/0'/0/x`,
              hi: `इथेरियम क्लासिक — मेटामास्क जैसा — m/44'/61'/0'/0/x`,
              es: `Ethereum Classic — Estilo MetaMask — m/44'/61'/0'/0/x`,
              ar: `إيثريوم كلاسيك — مثل MetaMask — m/44'/61'/0'/0/x`,
              fr: `Ethereum Classic — Style MetaMask — m/44'/61'/0'/0/x`,
              de: `Ethereum Classic — MetaMask-ähnlich — m/44'/61'/0'/0/x`,
              ru: `Ethereum Classic — похоже на MetaMask — m/44'/61'/0'/0/x`,
              pt: `Ethereum Classic — Estilo MetaMask — m/44'/61'/0'/0/x`,
              ja: `Ethereum Classic — MetaMask のよう — m/44'/61'/0'/0/x`,
              pa: `ਇਥੇਰੀਅਮ ਕਲਾਸਿਕ — ਮੇਟਾਮਾਸਕ ਜਿਵੇਂ — m/44'/61'/0'/0/x`,
              bn: `ইথেরিয়াম ক্লাসিক — মেটামাস্ক মত — m/44'/61'/0'/0/x`,
              id: `Ethereum Classic — Seperti MetaMask — m/44'/61'/0'/0/x`,
              ur: `ایتھیریم کلاسیک — میٹا ماسک جیسا — m/44'/61'/0'/0/x`,
              ms: `Ethereum Classic — Seperti MetaMask — m/44'/61'/0'/0/x`,
              it: `Ethereum Classic — Stile MetaMask — m/44'/61'/0'/0/x`,
              tr: `Ethereum Classic — MetaMask Benzeri — m/44'/61'/0'/0/x`,
              ta: `எதீரியம் கிளாசிக் — மெடாமாஸ்க் போன்ற — m/44'/61'/0'/0/x`,
              te: `ఎథిరియం క్లాసిక్ — మెటామాస్క్ లాంటి — m/44'/61'/0'/0/x`,
              ko: `이더리움 클래식 — MetaMask와 유사 — m/44'/61'/0'/0/x`,
              vi: `Ethereum Classic — Giống MetaMask — m/44'/61'/0'/0/x`,
              pl: `Ethereum Classic — Podobnie jak MetaMask — m/44'/61'/0'/0/x`,
              ro: `Ethereum Classic — Asemănător cu MetaMask — m/44'/61'/0'/0/x`,
              nl: `Ethereum Classic — MetaMask-achtig — m/44'/61'/0'/0/x`,
              el: `Ethereum Classic — Στυλ MetaMask — m/44'/61'/0'/0/x`,
              th: `Ethereum Classic — แบบ MetaMask — m/44'/61'/0'/0/x`,
              cs: `Ethereum Classic — Podobné jako MetaMask — m/44'/61'/0'/0/x`,
              hu: `Ethereum Classic — MetaMask-szerű — m/44'/61'/0'/0/x`,
              sv: `Ethereum Classic — MetaMask-liknande — m/44'/61'/0'/0/x`,
              da: `Ethereum Classic — MetaMask-lignende — m/44'/61'/0'/0/x`,
            }, locale)}
          </option>
          <option value="etc-metamask">
            {Locale.get({
              en: `Ethereum Classic — Ledger-like - m/44'/61'/x'/0/0`,
              zh: `以太经典 — 类似 Ledger — m/44'/61'/x'/0/0`,
              hi: `इथेरियम क्लासिक — लेजर जैसा — m/44'/61'/x'/0/0`,
              es: `Ethereum Classic — Estilo Ledger — m/44'/61'/x'/0/0`,
              ar: `إيثريوم كلاسيك — مثل ليدجر — m/44'/61'/x'/0/0`,
              fr: `Ethereum Classic — Style Ledger — m/44'/61'/x'/0/0`,
              de: `Ethereum Classic — Ledger-ähnlich — m/44'/61'/x'/0/0`,
              ru: `Ethereum Classic — похоже на Ledger — m/44'/61'/x'/0/0`,
              pt: `Ethereum Classic — Estilo Ledger — m/44'/61'/x'/0/0`,
              ja: `Ethereum Classic — Ledger のよう — m/44'/61'/x'/0/0`,
              pa: `ਇਥੇਰੀਅਮ ਕਲਾਸਿਕ — ਲੈਜ਼ਰ ਜਿਵੇਂ — m/44'/61'/x'/0/0`,
              bn: `ইথেরিয়াম ক্লাসিক — লেজার মত — m/44'/61'/x'/0/0`,
              id: `Ethereum Classic — Seperti Ledger — m/44'/61'/x'/0/0`,
              ur: `ایتھیریم کلاسیک — لیجر جیسا — m/44'/61'/x'/0/0`,
              ms: `Ethereum Classic — Seperti Ledger — m/44'/61'/x'/0/0`,
              it: `Ethereum Classic — Stile Ledger — m/44'/61'/x'/0/0`,
              tr: `Ethereum Classic — Ledger Benzeri — m/44'/61'/x'/0/0`,
              ta: `எதீரியம் கிளாசிக் — லெஜர் போன்ற — m/44'/61'/x'/0/0`,
              te: `ఎథిరియం క్లాసిక్ — లెజర్ లాంటి — m/44'/61'/x'/0/0`,
              ko: `이더리움 클래식 — Ledger와 유사 — m/44'/61'/x'/0/0`,
              vi: `Ethereum Classic — Giống Ledger — m/44'/61'/x'/0/0`,
              pl: `Ethereum Classic — Podobnie jak Ledger — m/44'/61'/x'/0/0`,
              ro: `Ethereum Classic — Asemănător cu Ledger — m/44'/61'/x'/0/0`,
              nl: `Ethereum Classic — Ledger-achtig — m/44'/61'/x'/0/0`,
              el: `Ethereum Classic — Στυλ Ledger — m/44'/61'/x'/0/0`,
              th: `Ethereum Classic — แบบ Ledger — m/44'/61'/x'/0/0`,
              cs: `Ethereum Classic — Podobné jako Ledger — m/44'/61'/x'/0/0`,
              hu: `Ethereum Classic — Ledger-szerű — m/44'/61'/x'/0/0`,
              sv: `Ethereum Classic — Ledger-liknande — m/44'/61'/x'/0/0`,
              da: `Ethereum Classic — Ledger-lignende — m/44'/61'/x'/0/0`,
            }, locale)}
          </option>
          <option value="custom">
            {Locale.get(Locale.Custom, locale)}
          </option>
        </select>
      </ContrastLabel>
      {rawDerivation === "custom" && <>
        <div className="h-2" />
        {PathInput}
      </>}
      {rawDerivation !== "custom" && <>
        <div className="h-2" />
        {IndexInput}
      </>}
      <div className="h-4" />
      <div className="flex items-center flex-wrap-reverse gap-2">
        {AddButon}
      </div>
    </div>
  </>
}
