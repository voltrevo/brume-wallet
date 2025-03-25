/* eslint-disable @next/next/no-img-element */
import { Color } from "@/libs/colors/colors";
import { Errors, UIError } from "@/libs/errors";
import { ChainData, chainDataByChainId, strictChainDataByChainId, tokenByAddress } from "@/libs/ethereum/mods/chain";
import { useDisplayRaw, useDisplayUsd } from "@/libs/fixed";
import { Outline, Solid } from "@/libs/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { AnchorProps } from "@/libs/react/props/html";
import { UUIDProps } from "@/libs/react/props/uuid";
import { State } from "@/libs/react/state";
import { Records } from "@/libs/records";
import { ClickableContrastAnchor, PaddedRoundedClickableNakedAnchor, WideClickableNakedMenuAnchor } from "@/libs/ui/anchor";
import { ClickableContrastButton, WideClickableNakedMenuButton } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog";
import { Loading, SmallUnflexLoading } from "@/libs/ui/loading";
import { Menu } from "@/libs/ui/menu";
import { PageBody, PageHeader } from "@/libs/ui/page/header";
import { UserPage } from "@/libs/ui/page/page";
import { GapperAndClickerInAnchorDiv } from "@/libs/ui/shrinker";
import { Balance } from "@/mods/universal/ethereum/mods/tokens/mods/balance";
import { useContractTokenBalance, useContractTokenPricedBalance, useNativeTokenBalance, useNativeTokenPricedBalance, useOfflineContractTokenBalance, useOfflineContractTokenPricedBalance, useOfflineNativeTokenBalance, useOfflineNativeTokenPricedBalance } from "@/mods/universal/ethereum/mods/tokens/mods/balance/hooks";
import { useRankedToken } from "@/mods/universal/ethereum/mods/tokens/mods/contest/hooks";
import { ContractTokenData, ContractTokenInfo, NativeTokenData, NativeTokenInfo, Token, TokenData, TokenInfo, TokenRef } from "@/mods/universal/ethereum/mods/tokens/mods/core";
import { useContractToken, useUserTokens, useWalletTokens } from "@/mods/universal/ethereum/mods/tokens/mods/core/hooks";
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin";
import { Address, Fixed, ZeroHexString } from "@hazae41/cubane";
import { Data, Fail, Fetched } from "@hazae41/glacier";
import { Wc, WcMetadata } from "@hazae41/latrine";
import { None, Option, Optional, Some } from "@hazae41/option";
import { CloseContext, useCloseContext } from "@hazae41/react-close-context";
import { Result } from "@hazae41/result";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Fragment, useCallback, useMemo, useState } from "react";
import { useBackgroundContext } from "../../background/context";
import { useLocaleContext } from "../../global/mods/locale";
import { Locale } from "../../locale";
import { useUserStorageContext } from "../../user/mods/storage";
import { useEnsReverse } from "../names/data";
import { TokenAddDialog } from "../tokens/add/dialog";
import { WalletEditDialog } from "./actions/edit";
import { WalletDataReceiveScreen } from "./actions/receive/receive";
import { WalletSendScreen } from "./actions/send";
import { RawWalletDataCard } from "./card";
import { useWalletDataContext, WalletDataProvider } from "./context";
import { EthereumWalletInstance, useEthereumContext, useWallet } from "./data";

export function WalletPage(props: UUIDProps) {
  const { uuid } = props

  return <WalletDataProvider uuid={uuid}>
    <WalletDataPage />
  </WalletDataProvider>
}

export function AnchorCard(props: AnchorProps) {
  const { children, ...rest } = props

  return <a className="group p-4 bg-default-contrast rounded-xl cursor-pointer focus:outline-black focus:outline-1"
    {...rest}>
    <GapperAndClickerInAnchorDiv>
      {children}
    </GapperAndClickerInAnchorDiv>
  </a>
}

function WalletDataPage() {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()

  const hash = useHashSubpath(path)

  const mainnet = useEthereumContext(wallet.uuid, chainDataByChainId[1]).getOrThrow()

  useEnsReverse(wallet.address, mainnet)

  const add = useBooleanHandle(false)

  const userTokensQuery = useUserTokens()

  const walletTokensQuery = useWalletTokens(wallet)

  const [walletTokens, userTokens, builtinTokens] = useMemo(() => {
    const [wallets = []] = [walletTokensQuery.data?.get()]
    const [users = []] = [userTokensQuery.data?.get()]

    const natives = Object.values(chainDataByChainId).map(x => x.token)
    const contracts = Object.values(tokenByAddress)
    const builtins = [...natives, ...contracts]

    const sorter = (a: Token, b: Token) => {
      const dChainId = a.chainId - b.chainId

      if (dChainId !== 0)
        return dChainId

      if (a.type === "native")
        return -1
      if (b.type === "native")
        return 1

      return 0
    }

    return [wallets, users, builtins].map(x => x.sort(sorter))
  }, [userTokensQuery.data, walletTokensQuery.data])

  const connect = useCoords(hash, "/connect")
  const receive = useCoords(hash, "/receive")

  const $flip = useState(false)
  const [flip, setFlip] = $flip

  const $privateKey = useState<Optional<ZeroHexString>>()
  const [privateKey, setPrivateKey] = $privateKey

  const onUnflip = useCallback(() => {
    setPrivateKey(undefined)
    setFlip(false)
  }, [setFlip, setPrivateKey])

  const Header =
    <PageHeader title={Locale.get(Locale.Wallet, locale)}>
      <div className="flex items-center gap-2">
        <PaddedRoundedClickableNakedAnchor
          onKeyDown={connect.onKeyDown}
          onClick={connect.onClick}
          href={connect.href}>
          <img className="size-5"
            alt="WalletConnect"
            src="/assets/wc.svg" />
        </PaddedRoundedClickableNakedAnchor>
      </div>
    </PageHeader>

  const Card =
    <div className="p-4 flex justify-center">
      <div className="w-full max-w-sm">
        <div className="w-full aspect-video rounded-xl">
          <RawWalletDataCard
            privateKey={privateKey}
            flip={flip}
            unflip={onUnflip}
            href="/menu" />
        </div>
        {wallet.type === "readonly" && <>
          <div className="h-2" />
          <div className="po-1 bg-default-contrast text-default-contrast rounded-xl flex items-center justify-center">
            <Outline.EyeIcon className="size-5" />
            <div className="w-2" />
            <div>
              This is a watch-only wallet
            </div>
          </div>
        </>}
      </div>
    </div>

  const Apps =
    <div className="po-2 flex items-center justify-center gap-2">
      <ClickableContrastAnchor
        onKeyDown={receive.onKeyDown}
        onClick={receive.onClick}
        href={receive.href}>
        <Outline.QrCodeIcon className="size-4" />
        {Locale.get(Locale.Receive, locale)}
      </ClickableContrastAnchor>
    </div>

  const Body =
    <PageBody>
      {add.current &&
        <CloseContext value={add.disable}>
          <Dialog>
            <TokenAddDialog />
          </Dialog>
        </CloseContext>}
      {walletTokens.length > 0 && <>
        <div className="font-medium text-xl">
          {Locale.get({
            en: "Favorite tokens",
            zh: "收藏代币",
            hi: "पसंदीदा टोकन",
            es: "Tokens favoritos",
            ar: "الرموز المفضلة",
            fr: "Jetons favoris",
            de: "Lieblingstoken",
            ru: "Любимые токены",
            pt: "Tokens favoritos",
            ja: "お気に入りのトークン",
            pa: "ਪਸੰਦੀਦਾ ਟੋਕਨ",
            bn: "প্রিয় টোকেন",
            id: "Token favorit",
            ur: "پسندیدہ ٹوکن",
            ms: "Token kegemaran",
            it: "Token preferiti",
            tr: "Favori jetonlar",
            ta: "பிடித்த டோக்கன்கள்",
            te: "ఇష్టమైన టోకెన్లు",
            ko: "선호하는 토큰",
            vi: "Token yêu thích",
            pl: "Ulubione tokeny",
            ro: "Tokenuri preferate",
            nl: "Favoriete tokens",
            el: "Αγαπημένα τοκεν",
            th: "โทเคนที่ชื่นชอบ",
            cs: "Oblíbené tokeny",
            hu: "Kedvenc tokenek",
            sv: "Favorittokens",
            da: "Foretrukne tokens",
          }, locale)}
        </div>
        <div className="h-4" />
        <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
          {walletTokens.map(token =>
            <Fragment key={token.uuid}>
              <OnlineTokenRow token={token} />
            </Fragment>)}
        </div>
        <div className="h-2" />
      </>}
      <div className="font-medium text-xl">
        {Locale.get({
          en: "Top-voted tokens",
          zh: "投票最多的代币",
          hi: "शीर्ष वोटेड टोकन",
          es: "Tokens más votados",
          ar: "أعلى الرموز المصوتة",
          fr: "Jetons les plus votés",
          de: "Am meisten gewählte Token",
          ru: "Самые голосованные токены",
          pt: "Tokens mais votados",
          ja: "最も投票されたトークン",
          pa: "ਸਭ ਤੋਂ ਵੱਧ ਵੋਟੇ ਟੋਕਨ",
          bn: "সেরা ভোটেড টোকেন",
          id: "Token yang paling banyak dipilih",
          ur: "سب سے زیادہ ووٹ والے ٹوکن",
          ms: "Token yang paling banyak diundi",
          it: "Token più votati",
          tr: "En çok oy alan jetonlar",
          ta: "அதிக வாக்குகள் பெற்ற டோக்கன்கள்",
          te: "అత్యధిక వోటు పొందిన టోకెన్లు",
          ko: "가장 많이 투표된 토큰",
          vi: "Token được bình chọn nhiều nhất",
          pl: "Najbardziej głosowane tokeny",
          ro: "Cele mai votate tokenuri",
          nl: "Meest gestemde tokens",
          el: "Τα πιο ψηφισμένα τοκεν",
          th: "โทเคนที่ได้รับการโหวตมากที่สุด",
          cs: "Nejvíce hlasované tokeny",
          hu: "A legtöbb szavazatot kapott tokenek",
          sv: "Mest röstade tokens",
          da: "Mest stemte tokens",
        }, locale)}
      </div>
      <div className="h-4" />
      <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
        <RankedTokenRow rank={0} />
        <RankedTokenRow rank={1} />
        <RankedTokenRow rank={2} />
      </div>
      <div className="h-2" />
      <div className="flex items-center gap-2">
        <div className="font-medium text-xl">
          {Locale.get({
            en: "Other tokens",
            zh: "其他代币",
            hi: "अन्य टोकन",
            es: "Otros tokens",
            ar: "الرموز الأخرى",
            fr: "Autres jetons",
            de: "Andere Token",
            ru: "Другие токены",
            pt: "Outros tokens",
            ja: "その他のトークン",
            pa: "ਹੋਰ ਟੋਕਨ",
            bn: "অন্যান্য টোকেন",
            id: "Token lain",
            ur: "دوسرے ٹوکن",
            ms: "Token lain",
            it: "Altri token",
            tr: "Diğer jetonlar",
            ta: "பிற டோக்கன்கள்",
            te: "ఇతర టోకెన్లు",
            ko: "다른 토큰",
            vi: "Các token khác",
            pl: "Inne tokeny",
            ro: "Alte tokenuri",
            nl: "Andere tokens",
            el: "Άλλα τοκεν",
            th: "โทเคนอื่น ๆ",
            cs: "Další tokeny",
            hu: "Egyéb tokenek",
            sv: "Andra tokens",
            da: "Andre tokens",
          }, locale)}
        </div>
        <div className="grow" />
        <ClickableContrastButton
          onClick={add.enable}>
          <Outline.PlusIcon className="size-5" />
          {Locale.get(Locale.Add, locale)}
        </ClickableContrastButton>
      </div>
      <div className="h-4" />
      <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
        {userTokens.map(token =>
          <Fragment key={token.uuid}>
            <OfflineTokenRow token={token} />
          </Fragment>)}
        {builtinTokens.map(token =>
          <Fragment key={token.uuid}>
            <OfflineTokenRow token={token} />
          </Fragment>)}
      </div>
    </PageBody>

  return <UserPage>
    <HashSubpathProvider>
      {hash.url.pathname === "/connect" &&
        <Menu>
          <WalletConnectMenu />
        </Menu>}
      {hash.url.pathname === "/send" &&
        <Dialog>
          <WalletSendScreen />
        </Dialog>}
      {hash.url.pathname === "/edit" &&
        <Dialog>
          <WalletEditDialog />
        </Dialog>}
      {hash.url.pathname === "/receive" &&
        <Dialog dark>
          <WalletDataReceiveScreen />
        </Dialog>}
      {hash.url.pathname === "/menu" &&
        <Menu>
          <WalletMenu
            $privateKey={$privateKey}
            $flip={$flip} />
        </Menu>}
    </HashSubpathProvider>
    {Header}
    {Card}
    {Apps}
    {Body}
  </UserPage>
}

export function RankedTokenRow(props: { rank: number }) {
  const wallet = useWalletDataContext().getOrThrow()
  const { rank } = props

  const mainnet = useEthereumContext(wallet.uuid, strictChainDataByChainId[1]).getOrThrow()

  const tokenQuery = useRankedToken(mainnet, "latest", rank)
  const tokenInfo = tokenQuery.data?.get()

  if (tokenInfo == null)
    return <div className="flex items-center justify-center po-2">
      <Loading className="size-5" />
    </div>

  const chainData = Records.getOrNull(chainDataByChainId, tokenInfo.chainId)

  if (chainData == null)
    return null

  return <OfflineTokenRow token={tokenInfo} />
}

export function WalletMenu(props: {
  $flip: State<boolean>,
  $privateKey: State<Optional<ZeroHexString>>
}) {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()
  const close = useCloseContext().getOrThrow()
  const { $flip, $privateKey } = props

  const [flip, setFlip] = $flip
  const [privateKey, setPrivateKey] = $privateKey

  const edit = useCoords(path, "/edit")

  const flipOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    const instance = await EthereumWalletInstance.createOrThrow(wallet, background)
    const privateKey = await instance.getPrivateKeyOrThrow(background)

    setPrivateKey(privateKey)
    setFlip(true)

    close()
  }), [background, close, setFlip, setPrivateKey, wallet])

  const onUnflipClick = useCallback(async () => {
    setFlip(false)

    close()
  }, [close, setFlip])

  const walletQuery = useWallet(wallet.uuid)

  const trashOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await walletQuery.mutateOrThrow(s => {
      const current = s.real?.current

      if (current == null)
        return new None()
      if (current.isErr())
        return new None()

      return new Some(current.mapSync(w => ({ ...w, trashed: true })).setInit({ ...current, expiration: Date.now() + (30 * 24 * 60 * 15 * 1000) }))
    })

    close()
  }), [close, walletQuery])

  const untrashOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    await walletQuery.mutateOrThrow(s => {
      const current = s.real?.current

      if (current == null)
        return new None()
      if (current.isErr())
        return new None()

      return new Some(current.mapSync(w => ({ ...w, trashed: undefined })).setInit({ ...current, expiration: undefined }))
    })

    close()
  }), [close, walletQuery])

  return <div className="flex flex-col text-left gap-2">
    <WideClickableNakedMenuAnchor
      onClick={edit.onClick}
      onKeyDown={edit.onKeyDown}
      href={edit.href}>
      <Outline.PencilIcon className="size-4" />
      {Locale.get(Locale.Edit, locale)}
    </WideClickableNakedMenuAnchor>
    {!privateKey &&
      <WideClickableNakedMenuButton
        disabled={flipOrAlert.loading}
        onClick={flipOrAlert.run}>
        <Outline.EyeIcon className="size-4" />
        {Locale.get(Locale.Flip, locale)}
      </WideClickableNakedMenuButton>}
    {privateKey &&
      <WideClickableNakedMenuButton
        onClick={onUnflipClick}>
        <Outline.EyeSlashIcon className="size-4" />
        {Locale.get(Locale.Flip, locale)}
      </WideClickableNakedMenuButton>}
    {!wallet.trashed &&
      <WideClickableNakedMenuButton
        disabled={trashOrAlert.loading}
        onClick={trashOrAlert.run}>
        <Outline.TrashIcon className="size-4" />
        {Locale.get(Locale.Delete, locale)}
      </WideClickableNakedMenuButton>}
    {wallet.trashed &&
      <WideClickableNakedMenuButton
        disabled={untrashOrAlert.loading}
        onClick={untrashOrAlert.run}>
        <Outline.TrashIcon className="size-4" />
        {Locale.get(Locale.Restore, locale)}
      </WideClickableNakedMenuButton>}
  </div>
}

export function WalletConnectMenu() {
  const locale = useLocaleContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()
  const close = useCloseContext().getOrThrow()

  const connectOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    const clipboard = await Result.runAndWrap(async () => {
      return await navigator.clipboard.readText()
    }).then(r => r.orElseSync(() => {
      return Option.wrap(prompt(Locale.get({
        en: "Please paste a WalletConnect link",
        zh: "请粘贴一个 WalletConnect 链接",
        hi: "कृपया एक वॉलेट कनेक्ट लिंक पेस्ट करें",
        es: "Por favor, pegue un enlace de WalletConnect",
        ar: "يرجى لصق رابط WalletConnect",
        fr: "Veuillez coller un lien WalletConnect",
        de: "Bitte fügen Sie einen WalletConnect-Link ein",
        ru: "Пожалуйста, вставьте ссылку WalletConnect",
        pt: "Por favor, cole um link WalletConnect",
        ja: "WalletConnect リンクを貼り付けてください",
        pa: "ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਵਾਲੇਟ ਕਨੈਕਟ ਲਿੰਕ ਚਿਪਕਾਓ",
        bn: "দয়া করে একটি ওয়ালেট কানেক্ট লিঙ্ক পেস্ট করুন",
        id: "Silakan tempelkan tautan WalletConnect",
        ur: "براہ کرم ایک ویلٹ کنیکٹ لنک پیسٹ کریں",
        ms: "Sila tampal pautan WalletConnect",
        it: "Si prega di incollare un link WalletConnect",
        tr: "Lütfen bir WalletConnect bağlantısı yapıştırın",
        ta: "ஒரு வாலெட்ட் கனெக்ட் இணைப்பை பேஸ்ட் செய்யவும்",
        te: "దయచేసి ఒక వాలెట్ కనెక్ట్ లింక్ పేస్ట్ చేయండి",
        ko: "WalletConnect 링크를 붙여 넣으십시오",
        vi: "Vui lòng dán liên kết WalletConnect",
        pl: "Proszę wkleić link WalletConnect",
        ro: "Vă rugăm să lipiți un link WalletConnect",
        nl: "Plak een WalletConnect-link",
        el: "Παρακαλώ επικολλήστε ένα σύνδεσμο WalletConnect",
        th: "กรุณาวางลิงก์ WalletConnect",
        cs: "Vložte odkaz WalletConnect",
        hu: "Kérjük, illesszen be egy WalletConnect linket",
        sv: "Klistra in en WalletConnect-länk",
        da: "Indsæt et WalletConnect-link",
      }, locale))).ok()
    }).getOrThrow())

    const url = Result.runAndWrapSync(() => {
      return new URL(clipboard)
    }).mapErrSync(() => {
      return new UIError(Locale.get({
        en: "You must copy a WalletConnect link",
        zh: "您必须复制一个 WalletConnect 链接",
        hi: "आपको एक वॉलेट कनेक्ट लिंक कॉपी करना होगा",
        es: "Debe copiar un enlace de WalletConnect",
        ar: "يجب عليك نسخ رابط WalletConnect",
        fr: "Vous devez copier un lien WalletConnect",
        de: "Sie müssen einen WalletConnect-Link kopieren",
        ru: "Вы должны скопировать ссылку WalletConnect",
        pt: "Você deve copiar um link WalletConnect",
        ja: "WalletConnect リンクをコピーする必要があります",
        pa: "ਤੁਹਾਨੂੰ ਇੱਕ ਵਾਲੇਟ ਕਨੈਕਟ ਲਿੰਕ ਕਾਪੀ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ",
        bn: "আপনাকে একটি ওয়ালেট কানেক্ট লিঙ্ক কপি করতে হবে",
        id: "Anda harus menyalin tautan WalletConnect",
        ur: "آپ کو ایک ویلٹ کنیکٹ لنک کاپی کرنا ہوگا",
        ms: "Anda perlu menyalin pautan WalletConnect",
        it: "Devi copiare un link WalletConnect",
        tr: "Bir WalletConnect bağlantısı kopyalamanız gerekiyor",
        ta: "ஒரு வாலெட்ட் கனெக்ட் லிங்கை நகலெடுக்க வேண்டும்",
        te: "మీరు ఒక వాలెట్ కనెక్ట్ లింక్ కాపీ చేయాలి",
        ko: "WalletConnect 링크를 복사해야합니다",
        vi: "Bạn phải sao chép một liên kết WalletConnect",
        pl: "Musisz skopiować link WalletConnect",
        ro: "Trebuie să copiați un link WalletConnect",
        nl: "U moet een WalletConnect-link kopiëren",
        el: "Πρέπει να αντιγράψετε ένα σύνδεσμο WalletConnect",
        th: "คุณต้องคัดลอกลิงก์ WalletConnect",
        cs: "Musíte zkopírovat odkaz WalletConnect",
        hu: "Egy WalletConnect linket kell másolnia",
        sv: "Du måste kopiera en WalletConnect-länk",
        da: "Du skal kopiere et WalletConnect-link",
      }, locale))
    }).getOrThrow()

    Result.runAndWrapSync(() => {
      return Wc.parseOrThrow(url)
    }).mapErrSync(() => {
      return new UIError(Locale.get({
        en: "You must copy a WalletConnect link",
        zh: "您必须复制一个 WalletConnect 链接",
        hi: "आपको एक वॉलेट कनेक्ट लिंक कॉपी करना होगा",
        es: "Debe copiar un enlace de WalletConnect",
        ar: "يجب عليك نسخ رابط WalletConnect",
        fr: "Vous devez copier un lien WalletConnect",
        de: "Sie müssen einen WalletConnect-Link kopieren",
        ru: "Вы должны скопировать ссылку WalletConnect",
        pt: "Você deve copiar um link WalletConnect",
        ja: "WalletConnect リンクをコピーする必要があります",
        pa: "ਤੁਹਾਨੂੰ ਇੱਕ ਵਾਲੇਟ ਕਨੈਕਟ ਲਿੰਕ ਕਾਪੀ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ",
        bn: "আপনাকে একটি ওয়ালেট কানেক্ট লিঙ্ক কপি করতে হবে",
        id: "Anda harus menyalin tautan WalletConnect",
        ur: "آپ کو ایک ویلٹ کنیکٹ لنک کاپی کرنا ہوگا",
        ms: "Anda perlu menyalin pautan WalletConnect",
        it: "Devi copiare un link WalletConnect",
        tr: "Bir WalletConnect bağlantısı kopyalamanız gerekiyor",
        ta: "ஒரு வாலெட்ட் கனெக்ட் லிங்கை நகலெடுக்க வேண்டும்",
        te: "మీరు ఒక వాలెట్ కనెక్ట్ లింక్ కాపీ చేయాలి",
        ko: "WalletConnect 링크를 복사해야합니다",
        vi: "Bạn phải sao chép một liên kết WalletConnect",
        pl: "Musisz skopiować link WalletConnect",
        ro: "Trebuie să copiați un link WalletConnect",
        nl: "U moet een WalletConnect-link kopiëren",
        el: "Πρέπει να αντιγράψετε ένα σύνδεσμο WalletConnect",
        th: "คุณต้องคัดลอกลิงก์ WalletConnect",
        cs: "Musíte zkopírovat odkaz WalletConnect",
        hu: "Egy WalletConnect linket kell másolnia",
        sv: "Du måste kopiera en WalletConnect-länk",
        da: "Du skal kopiere et WalletConnect-link",
      }, locale))
    }).getOrThrow()

    alert(Locale.get(Locale.Connecting, locale))

    const metadata = await background.requestOrThrow<WcMetadata>({
      method: "brume_wc_connect",
      params: [clipboard, wallet.uuid]
    }).then(r => r.getOrThrow())

    alert(Locale.get({
      en: `Connected to ${metadata.name}`,
      zh: `连接到 ${metadata.name}`,
      hi: `${metadata.name} से कनेक्ट किया गया`,
      es: `Conectado a ${metadata.name}`,
      ar: `متصل بـ ${metadata.name}`,
      fr: `Connecté à ${metadata.name}`,
      de: `Verbunden mit ${metadata.name}`,
      ru: `Подключено к ${metadata.name}`,
      pt: `Conectado a ${metadata.name}`,
      ja: `${metadata.name} に接続しました`,
      pa: `${metadata.name} ਨਾਲ ਕੁਨੈਕਟ ਕੀਤਾ`,
      bn: `${metadata.name} এ সংযুক্ত হয়েছে`,
      id: `Terhubung ke ${metadata.name}`,
      ur: `${metadata.name} سے منسلک`,
      ms: `Disambungkan ke ${metadata.name}`,
      it: `Connesso a ${metadata.name}`,
      tr: `${metadata.name} ile bağlandı`,
      ta: `${metadata.name} உடன் இணைந்துள்ளது`,
      te: `${metadata.name} నుండి కనెక్ట్`,
      ko: `${metadata.name} 에 연결됨`,
      vi: `Đã kết nối với ${metadata.name}`,
      pl: `Połączono z ${metadata.name}`,
      ro: `Conectat la ${metadata.name}`,
      nl: `Verbonden met ${metadata.name}`,
      el: `Συνδέθηκε στο ${metadata.name}`,
      th: `เชื่อมต่อกับ ${metadata.name}`,
      cs: `Připojeno k ${metadata.name}`,
      hu: `Csatlakozva a ${metadata.name}hez`,
      sv: `Ansluten till ${metadata.name}`,
      da: `Tilsluttet til ${metadata.name}`,
    }, locale))

    close()
  }), [wallet, background, locale, close])

  return <div className="flex flex-col text-left gap-2">
    <WideClickableNakedMenuAnchor
      href={`#/wallet/${wallet.uuid}/camera`}>
      <Outline.QrCodeIcon className="size-4" />
      {Locale.get(Locale.Scan, locale)}
    </WideClickableNakedMenuAnchor>
    <WideClickableNakedMenuButton
      disabled={connectOrAlert.loading}
      onClick={connectOrAlert.run}>
      <Outline.LinkIcon className="size-4" />
      {Locale.get(Locale.Paste, locale)}
    </WideClickableNakedMenuButton>
  </div>
}

function OnlineTokenRow(props: { token: TokenInfo }) {
  const { token } = props

  if (token.type === "native")
    return <OnlineNativeTokenRow token={token} />
  if (token.type === "contract")
    return <OnlineContractTokenRow token={token} />
  return null
}

function OfflineTokenRow(props: { token: TokenInfo }) {
  const { token } = props

  if (token.type === "native")
    return <OfflineNativeTokenRow token={token} />
  if (token.type === "contract")
    return <OfflineContractTokenRow token={token} />
  return null
}

function OnlineNativeTokenRow(props: { token: NativeTokenInfo }) {
  const path = usePathContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const { token } = props

  const chainData = chainDataByChainId[token.chainId]
  const tokenData = chainData.token

  const hash = useHashSubpath(path)
  const menu = useCoords(hash, `/token/${tokenData.chainId}`)

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const valuedBalanceQuery = useNativeTokenBalance(context, wallet.address as Address, "latest")
  const pricedBalanceQuery = useNativeTokenPricedBalance(context, wallet.address as Address, "latest")

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === `/token/${tokenData.chainId}` &&
        <Menu>
          <NativeTokenMenu
            tokenData={tokenData}
            chainData={chainData} />
        </Menu>}
    </HashSubpathProvider>
    <TokenRowAnchor
      href={menu.href}
      onClick={menu.onClick}
      onContextMenu={menu.onContextMenu}
      token={tokenData}
      chain={chainData}
      balanceQuery={valuedBalanceQuery}
      balanceUsdQuery={pricedBalanceQuery} />
  </>
}

function OfflineNativeTokenRow(props: { token: NativeTokenInfo }) {
  const path = usePathContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const { token } = props

  const chainData = chainDataByChainId[token.chainId]
  const tokenData = chainData.token

  const hash = useHashSubpath(path)
  const menu = useCoords(hash, `/token/${tokenData.chainId}`)

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const valuedBalanceQuery = useOfflineNativeTokenBalance(context, wallet.address as Address, "latest")
  const pricedBalanceQuery = useOfflineNativeTokenPricedBalance(context, wallet.address as Address, "latest")

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === `/token/${tokenData.chainId}` &&
        <Menu>
          <NativeTokenMenu
            tokenData={tokenData}
            chainData={chainData} />
        </Menu>}
    </HashSubpathProvider>
    <TokenRowAnchor
      href={menu.href}
      onClick={menu.onClick}
      onContextMenu={menu.onContextMenu}
      token={tokenData}
      chain={chainData}
      balanceQuery={valuedBalanceQuery}
      balanceUsdQuery={pricedBalanceQuery} />
  </>
}

function OnlineContractTokenRow(props: { token: ContractTokenInfo }) {
  const path = usePathContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const { token } = props

  const chainData = chainDataByChainId[token.chainId]

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const tokenQuery = useContractToken(context, token.address, "latest")
  const maybeTokenData = tokenQuery.data?.get()

  const hash = useHashSubpath(path)
  const menu = useCoords(hash, `/token/${token.chainId}/${token.address}`)

  const valuedBalanceQuery = useContractTokenBalance(context, token.address, wallet.address as Address, "latest")
  const pricedBalanceQuery = useContractTokenPricedBalance(context, token.address, wallet.address as Address, "latest")

  if (maybeTokenData == null)
    return null

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === `/token/${token.chainId}/${token.address}` &&
        <Menu>
          <ContractTokenMenu
            tokenData={maybeTokenData}
            chainData={chainData} />
        </Menu>}
    </HashSubpathProvider>
    <TokenRowAnchor
      href={menu.href}
      onClick={menu.onClick}
      onContextMenu={menu.onContextMenu}
      token={maybeTokenData}
      chain={chainData}
      balanceQuery={valuedBalanceQuery}
      balanceUsdQuery={pricedBalanceQuery} />
  </>
}

function OfflineContractTokenRow(props: { token: ContractTokenInfo }) {
  const path = usePathContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const { token } = props

  const chainData = chainDataByChainId[token.chainId]

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const tokenQuery = useContractToken(context, token.address, "latest")
  const maybeTokenData = tokenQuery.data?.get()

  const hash = useHashSubpath(path)
  const menu = useCoords(hash, `/token/${token.chainId}/${token.address}`)

  const valuedBalanceQuery = useOfflineContractTokenBalance(context, token.address, wallet.address as Address, "latest")
  const pricedBalanceQuery = useOfflineContractTokenPricedBalance(context, token.address, wallet.address as Address, "latest")

  if (maybeTokenData == null)
    return null

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === `/token/${token.chainId}/${token.address}` &&
        <Menu>
          <ContractTokenMenu
            tokenData={maybeTokenData}
            chainData={chainData} />
        </Menu>}
    </HashSubpathProvider>
    <TokenRowAnchor
      href={menu.href}
      onClick={menu.onClick}
      onContextMenu={menu.onContextMenu}
      token={maybeTokenData}
      chain={chainData}
      balanceQuery={valuedBalanceQuery}
      balanceUsdQuery={pricedBalanceQuery} />
  </>
}

function NativeTokenMenu(props: { tokenData: NativeTokenData, chainData: ChainData }) {
  const close = useCloseContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const storage = useUserStorageContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const path = usePathContext().getOrThrow()
  const { tokenData, chainData } = props

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const send = useCoords(path, `/send?step=target&chain=${tokenData.chainId}`)

  const walletTokensQuery = useWalletTokens(wallet)

  const favorited = useMemo(() => {
    return walletTokensQuery.data?.get().find(x => x.uuid === tokenData.uuid) != null
  }, [walletTokensQuery.data, tokenData])

  const favoriteOrThrow = useCallback(async () => {
    await walletTokensQuery.mutateOrThrow(s => {
      const current = s.real?.current

      if (current == null)
        return new Some(new Data([TokenRef.from(tokenData)]))

      return new Some(current.mapSync(array => [...array, TokenRef.from(tokenData)]))
    })
  }, [walletTokensQuery.mutateOrThrow, tokenData])

  const unfavoriteOrThrow = useCallback(async () => {
    await walletTokensQuery.mutateOrThrow(s => {
      const current = s.real?.current

      if (current == null)
        return new None()

      return new Some(current.mapSync(array => array.filter(x => x.uuid !== tokenData.uuid)))
    })
  }, [walletTokensQuery.mutateOrThrow, tokenData])

  const toggleOrLogAndAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (!favorited)
      await favoriteOrThrow()
    else
      await unfavoriteOrThrow()

    close(true)
  }), [favorited, favoriteOrThrow, unfavoriteOrThrow, close])

  const fetchOrLogAndAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    Balance.Native.queryOrThrow(context, wallet.address as Address, "latest", storage)!.refetchOrThrow({ cache: "reload" }).catch(console.warn)
    Balance.Priced.Native.queryOrThrow(context, wallet.address as Address, "latest", storage)!.refetchOrThrow({ cache: "reload" }).catch(console.warn)

    close(true)
  }), [context, wallet, storage, close])

  return <div className="flex flex-col text-left gap-2">
    <WideClickableNakedMenuButton
      onClick={toggleOrLogAndAlert.run}>
      {favorited ? <Solid.StarIcon className="size-4" /> : <Outline.StarIcon className="size-4" />}
      {favorited ? Locale.get(Locale.Delete, locale) : Locale.get(Locale.Add, locale)}
    </WideClickableNakedMenuButton>
    <WideClickableNakedMenuButton
      onClick={fetchOrLogAndAlert.run}>
      <Outline.ArrowPathIcon className="size-4" />
      {Locale.get(Locale.Refresh, locale)}
    </WideClickableNakedMenuButton>
    <WideClickableNakedMenuAnchor
      aria-disabled={wallet.type === "readonly"}
      onClick={send.onClick}
      onKeyDown={send.onKeyDown}
      href={send.href}>
      <Outline.PaperAirplaneIcon className="size-4" />
      {Locale.get(Locale.Send, locale)}
    </WideClickableNakedMenuAnchor>
    <WideClickableNakedMenuAnchor
      aria-disabled>
      <Outline.BanknotesIcon className="size-4" />
      Faucet
    </WideClickableNakedMenuAnchor>
  </div>
}

function ContractTokenMenu(props: { tokenData: ContractTokenData, chainData: ChainData }) {
  const close = useCloseContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const storage = useUserStorageContext().getOrThrow()
  const wallet = useWalletDataContext().getOrThrow()
  const path = usePathContext().getOrThrow()
  const { tokenData, chainData } = props

  const context = useEthereumContext(wallet.uuid, chainData).getOrThrow()

  const send = useCoords(path, `/send?step=target&chain=${tokenData.chainId}&token=${tokenData.address}`)

  const walletTokensQuery = useWalletTokens(wallet)

  const favorited = useMemo(() => {
    return walletTokensQuery.data?.get().find(x => x.uuid === tokenData.uuid) != null
  }, [walletTokensQuery.data, tokenData])

  const favoriteOrThrow = useCallback(async () => {
    await walletTokensQuery.mutateOrThrow(s => {
      const current = s.real?.current

      if (current == null)
        return new Some(new Data([TokenRef.from(tokenData)]))

      return new Some(current.mapSync(array => [...array, TokenRef.from(tokenData)]))
    })
  }, [walletTokensQuery.mutateOrThrow, tokenData])

  const unfavoriteOrThrow = useCallback(async () => {
    await walletTokensQuery.mutateOrThrow(s => {
      const current = s.real?.current

      if (current == null)
        return new None()

      return new Some(current.mapSync(array => array.filter(x => x.uuid !== tokenData.uuid)))
    })
  }, [walletTokensQuery.mutateOrThrow, tokenData])

  const toggleOrLogAndAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (!favorited)
      await favoriteOrThrow()
    else
      await unfavoriteOrThrow()

    close(true)
  }), [favorited, favoriteOrThrow, unfavoriteOrThrow, close])

  const fetchOrLogAndAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    Balance.Contract.queryOrThrow(context, tokenData.address, wallet.address as Address, "latest", storage)!.refetchOrThrow({ cache: "reload" }).catch(console.warn)
    Balance.Priced.Contract.queryOrThrow(context, tokenData.address, wallet.address as Address, "latest", storage)!.refetchOrThrow({ cache: "reload" }).catch(console.warn)

    close(true)
  }), [context, wallet, tokenData, storage, close])

  return <div className="flex flex-col text-left gap-2">
    <WideClickableNakedMenuButton
      onClick={toggleOrLogAndAlert.run}>
      {favorited ? <Solid.StarIcon className="size-4" /> : <Outline.StarIcon className="size-4" />}
      {favorited ? Locale.get(Locale.Delete, locale) : Locale.get(Locale.Add, locale)}
    </WideClickableNakedMenuButton>
    <WideClickableNakedMenuButton
      onClick={fetchOrLogAndAlert.run}>
      <Outline.ArrowPathIcon className="size-4" />
      {Locale.get(Locale.Refresh, locale)}
    </WideClickableNakedMenuButton>
    <WideClickableNakedMenuAnchor
      aria-disabled={wallet.type === "readonly"}
      onClick={send.onClick}
      onKeyDown={send.onKeyDown}
      href={send.href}>
      <Outline.PaperAirplaneIcon className="size-4" />
      {Locale.get(Locale.Send, locale)}
    </WideClickableNakedMenuAnchor>
    <WideClickableNakedMenuAnchor
      aria-disabled>
      <Outline.BanknotesIcon className="size-4" />
      Faucet
    </WideClickableNakedMenuAnchor>
  </div>
}

export interface QueryLike<D, E> {
  readonly data?: Data<D>
  readonly error?: Fail<E>
  readonly current?: Fetched<D, E>
  readonly fetching?: boolean
}

function TokenRowAnchor(props: { token: TokenData } & { chain: ChainData } & { balanceQuery: QueryLike<Fixed.From, Error> } & { balanceUsdQuery: QueryLike<Fixed.From, Error> } & AnchorProps) {
  const locale = useLocaleContext().getOrThrow()
  const { token, chain, balanceQuery, balanceUsdQuery, ...others } = props

  const tokenId = token.type === "native"
    ? token.chainId + token.symbol
    : token.chainId + token.address + token.symbol

  const modhash = useModhash(tokenId)
  const color = Color.get(modhash)

  const balanceDisplay = useDisplayRaw(balanceQuery.data?.get(), locale)
  const balanceUsdDisplay = useDisplayUsd(balanceUsdQuery.data?.get(), locale)

  return <a className="po-1 group flex items-center text-left"
    {...others}>
    <div className={`relative h-12 w-12 flex items-center justify-center bg-${color}-400 dark:bg-${color}-500 text-white rounded-full shrink-0`}>
      <div className=""
        style={{ fontSize: `${Math.min((20 - (2 * token.symbol.length)), 16)}px` }}>
        {token.symbol}
      </div>
      <div className="absolute -bottom-2 -left-2">
        {chain.icon()}
      </div>
    </div>
    <div className="w-4 shrink-0" />
    <div className="grow min-w-0">
      <div className="flex items-center">
        <div className="truncate">
          {`${token.name} `}<span className="text-default-contrast">—</span>{` ${chain.name}`}
        </div>
      </div>
      <div className="flex items-center text-default-contrast gap-1">
        <div>{balanceDisplay} {token.symbol}</div>
        {balanceQuery.error != null && <ExclamationTriangleIcon className="h-4 mt-0.5" />}
        {balanceQuery.fetching && <SmallUnflexLoading />}
      </div>
      <div className="flex items-center text-default-contrast gap-1">
        <div>{balanceUsdDisplay}</div>
        {balanceUsdQuery.error != null && <ExclamationTriangleIcon className="h-4 mt-0.5" />}
        {balanceUsdQuery.fetching && <SmallUnflexLoading />}
      </div>
    </div>
  </a>
}