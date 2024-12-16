/* eslint-disable @next/next/no-img-element */
import { Color } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { Events } from "@/libs/react/events";
import { ChildrenProps } from "@/libs/react/props/children";
import { AnchorProps } from "@/libs/react/props/html";
import { SubtitleProps, TitleProps } from "@/libs/react/props/title";
import { ClickableContrastAnchor, ClickableOppositeAnchor, TextAnchor, WideClickableContrastAnchor, WideClickableNakedMenuAnchor } from "@/libs/ui/anchor";
import { Dialog } from "@/libs/ui/dialog";
import { Loading } from "@/libs/ui/loading";
import { Menu } from "@/libs/ui/menu";
import { PageBody } from "@/libs/ui/page/header";
import { GlobalPage } from "@/libs/ui/page/page";
import { urlOf } from "@/libs/url/url";
import { User } from "@/mods/background/service_worker/entities/users/data";
import { OneDisplay } from "@/mods/foreground/landing/1/1";
import { TwoDisplay } from "@/mods/foreground/landing/2/2";
import { ThreeDisplay } from "@/mods/foreground/landing/3/3";
import { FourDisplay } from "@/mods/foreground/landing/4/4";
import { FiveDisplay } from "@/mods/foreground/landing/5/5";
import { SixDisplay } from "@/mods/foreground/landing/6/6";
import { UserAvatar } from "@/mods/foreground/user/mods/avatar";
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin";
import { Fragment, useCallback } from "react";
import { UserCreateDialog } from "../entities/users/all/create";
import { useCurrentUser, useUser, useUsers } from "../entities/users/data";
import { UserLoginDialog } from "../entities/users/login";
import { useLocaleContext } from "../global/mods/locale";
import { Locale, Localized } from "../locale";

export function EmptyLandingPage(props: { next?: string }) {
  const lang = useLocaleContext().getOrThrow()
  const path = usePathContext().getOrThrow()
  const { next } = props

  const currentUserQuery = useCurrentUser()
  const currentUserLoading = !currentUserQuery.ready
  const maybeCurrentUser = currentUserQuery.current?.getOrNull()

  const userQuery = useUser(maybeCurrentUser?.uuid)
  const maybeUser = userQuery.current?.getOrNull()

  const subpath = useHashSubpath(path)
  const users = useCoords(subpath, "/users")

  return <>
    <HashSubpathProvider>
      {subpath.url.pathname === "/users/login" &&
        <Dialog>
          <UserLoginDialog next={next} />
        </Dialog>}
      {subpath.url.pathname === "/users/create" &&
        <Dialog>
          <UserCreateDialog next={next} />
        </Dialog>}
      {subpath.url.pathname === "/users" &&
        <Menu>
          <UsersMenu />
        </Menu>}
    </HashSubpathProvider>
    <GlobalPage>
      <PageBody>
        <div className="h-[max(24rem,100dvh_-_16rem)] flex-none flex flex-col items-center">
          <div className="grow" />
          <h1 className="flex flex-row data-[dir=rtl]:flex-row-reverse text-center text-6xl font-medium"
            data-dir={Locale.get(Locale.direction, lang)}>
            <div>
              {Locale.get(Locale.Hello, lang)}
            </div>
            <div>
              &nbsp;
            </div>
            <div className="text-contrast">
              {maybeUser?.name || "Anon"}
            </div>
          </h1>
          <div className="grow" />
          <div className="flex items-center">
            {currentUserLoading &&
              <ClickableOppositeAnchor
                aria-disabled>
                <Loading className="size-5" />
                Loading
              </ClickableOppositeAnchor>}
            {!currentUserLoading && maybeCurrentUser == null &&
              <ClickableOppositeAnchor
                onKeyDown={users.onKeyDown}
                onClick={users.onClick}
                href={users.href}>
                <Outline.LockOpenIcon className="size-5" />
                {Locale.get(Locale.Enter, lang)}
              </ClickableOppositeAnchor>}
            {!currentUserLoading && maybeCurrentUser != null &&
              <ClickableOppositeAnchor
                href="#/home">
                <Outline.HomeIcon className="size-5" />
                {Locale.get(Locale.Home, lang)}
              </ClickableOppositeAnchor>}
          </div>
          <div className="grow" />
        </div>
      </PageBody>
    </GlobalPage>
  </>
}

export function FullLandingPage(props: { next?: string }) {
  const lang = useLocaleContext().getOrThrow()
  const path = usePathContext().getOrThrow()
  const { next } = props

  const currentUserQuery = useCurrentUser()
  const currentUserLoading = !currentUserQuery.ready
  const maybeCurrentUser = currentUserQuery.data?.get()

  const subpath = useHashSubpath(path)
  const users = useCoords(subpath, "/users")

  return <>
    <HashSubpathProvider>
      {subpath.url.pathname === "/users/login" &&
        <Dialog>
          <UserLoginDialog next={next} />
        </Dialog>}
      {subpath.url.pathname === "/users/create" &&
        <Dialog>
          <UserCreateDialog next={next} />
        </Dialog>}
      {subpath.url.pathname === "/users" &&
        <Menu>
          <UsersMenu />
        </Menu>}
    </HashSubpathProvider>
    <GlobalPage>
      <PageBody>
        <div className="h-[max(24rem,100dvh_-_16rem)] flex-none flex flex-col items-center">
          <div className="grow" />
          <h1 className="text-center text-6xl font-medium">
            {Locale.get({
              "en": "The private Ethereum wallet",
              "zh": "私人以太坊钱包",
              "hi": "निजी ईथेरियम वॉलेट",
              "es": "La billetera Ethereum privada",
              "ar": "محفظة إيثريوم الخاصة",
              "fr": "Le portefeuille Ethereum confidentiel",
              "de": "Die private Ethereum-Brieftasche",
              "ru": "Частный кошелек Ethereum",
              "pt": "A carteira Ethereum privada",
              "ja": "プライベートイーサリアムウォレット",
              "pa": "ਨਿਜੀ ਇਥੇਰੀਅਮ ਵਾਲੇਟ",
              "bn": "ব্যক্তিগত ইথেরিয়াম ওয়ালেট",
              "id": "Dompet Ethereum pribadi",
              "ur": "نجی ایتھیریم والیٹ",
              "ms": "Dompet Ethereum peribadi",
              "it": "Il portafoglio Ethereum privato",
              "tr": "Özel Ethereum cüzdanı",
              "ta": "தனிப்பட்ட எதீரியம் வாலட்",
              "te": "ప్రైవేట్ ఎథిరియం వాలెట్",
              "ko": "개인 이더리움 지갑",
              "vi": "Ví Ethereum riêng",
              "pl": "Prywatny portfel Ethereum",
              "ro": "Portofelul privat Ethereum",
              "nl": "De privé Ethereum-portemonnee",
              "el": "Το ιδιωτικό πορτοφόλι Ethereum",
              "th": "กระเป๋าเงิน Ethereum ส่วนตัว",
              "cs": "Soukromá peněženka Ethereum",
              "hu": "A privát Ethereum tárca",
              "sv": "Den privata Ethereum-plånboken",
              "da": "Den private Ethereum-tegnebog",
            } satisfies Localized<string>, lang)}
          </h1>
          <div className="h-4" />
          <div className="text-center text-contrast text-2xl">
            {Locale.get({
              "en": "Meet the only Ethereum wallet with maximum privacy and security.",
              "zh": "了解唯一具有最大隐私和安全性的以太坊钱包。",
              "hi": "अधिकतम गोपनीयता और सुरक्षा के साथ एकमात्र ईथेरियम वॉलेट से मिलें।",
              "es": "Conozca la única billetera Ethereum con máxima privacidad y seguridad.",
              "ar": "تعرف على المحفظة الوحيدة للإيثريوم بأقصى درجات الخصوصية والأمان.",
              "fr": "Découvrez le seul portefeuille Ethereum avec une confidentialité et une sécurité maximales.",
              "de": "Lernen Sie die einzige Ethereum-Brieftasche mit maximaler Privatsphäre und Sicherheit kennen.",
              "ru": "Познакомьтесь с единственным кошельком Ethereum с максимальной конфиденциальностью и безопасностью.",
              "pt": "Conheça a única carteira Ethereum com máxima privacidade e segurança.",
              "ja": "最大限のプライバシーとセキュリティを備えた唯一のイーサリアムウォレットに会いましょう。",
              "pa": "ਸਭ ਤੋਂ ਜ਼ਿਆਦਾ ਗੁਪਤਤਾ ਅਤੇ ਸੁਰੱਖਿਆ ਵਾਲਾ ਇਕ ਮਾਤਰ ਇਥੇਰੀਅਮ ਵਾਲੇਟ ਨਾਲ ਮਿਲੋ।",
              "bn": "সর্বোচ্চ গোপনীয়তা এবং নিরাপত্তা সহ একমাত্র ইথেরিয়াম ওয়ালেট সাথে পরিচিত হন।",
              "id": "Temui satu-satunya dompet Ethereum dengan privasi dan keamanan maksimum.",
              "ur": "سب سے زیادہ رازداری اور حفاظت کے ساتھ ایک ہی ایتھیریم والیٹ سے ملیں۔",
              "ms": "Kenali dompet Ethereum tunggal dengan privasi dan keselamatan maksimum.",
              "it": "Incontra l'unico portafoglio Ethereum con massima privacy e sicurezza.",
              "tr": "Maksimum gizlilik ve güvenlikle tek Ethereum cüzdanıyla tanışın.",
              "ta": "அதிகப் பிரைவசி மற்றும் பாதுகாப்புடன் ஒரு இதீரியம் வாலட் சந்திக்கவும்.",
              "te": "అత్యధిక గోప్యత మరియు భద్రతతో ఒకే ఎథిరియం వాలెట్తో కలిగించుకోండి.",
              "ko": "최대 개인 정보 보호 및 보안을 갖춘 유일한 이더리움 지갑을 만나보세요.",
              "vi": "Hãy gặp ví Ethereum duy nhất với độ riêng tư và bảo mật tối đa.",
              "pl": "Poznaj jedyny portfel Ethereum z maksymalną prywatnością i bezpieczeństwem.",
              "ro": "Întâlniți singurul portofel Ethereum cu maximă confidențialitate și securitate.",
              "nl": "Maak kennis met de enige Ethereum-portemonnee met maximale privacy en veiligheid.",
              "el": "Γνωρίστε το μοναδικό πορτοφόλι Ethereum με μέγιστη απορρήτου και ασφάλεια.",
              "th": "พบกับกระเป๋าเงิน Ethereum เพียงหนึ่งเดียวที่มีความเป็นส่วนตัวและปลอดภัยสูงสุด",
              "cs": "Seznamte se s jedinou peněženkou Ethereum s maximální soukromí a bezpečností.",
              "hu": "Ismerje meg az egyetlen Ethereum pénztárcát maximális adatvédelemmel és biztonsággal.",
              "sv": "Möt den enda Ethereum-plånboken med maximal integritet och säkerhet.",
              "da": "Mød den eneste Ethereum-tegnebog med maksimal privatliv og sikkerhed.",
            } satisfies Localized<string>, lang)}
          </div>
          <div className="grow" />
          <div className="flex items-center">
            {currentUserLoading &&
              <ClickableOppositeAnchor
                aria-disabled>
                <Loading className="size-5" />
                {Locale.get(Locale.Loading, lang)}
              </ClickableOppositeAnchor>}
            {!currentUserLoading && maybeCurrentUser == null &&
              <ClickableOppositeAnchor
                onKeyDown={users.onKeyDown}
                onClick={users.onClick}
                href={users.href}>
                <Outline.LockOpenIcon className="size-5" />
                {Locale.get(Locale.Enter, lang)}
              </ClickableOppositeAnchor>}
            {!currentUserLoading && maybeCurrentUser != null &&
              <ClickableOppositeAnchor
                href="#/home">
                <Outline.HomeIcon className="size-5" />
                {Locale.get(Locale.Home, lang)}
              </ClickableOppositeAnchor>}
            <div className="w-2" />
            <ClickableContrastAnchor
              href={subpath.go("/download").href}>
              <Outline.ArrowDownTrayIcon className="size-5" />
              {Locale.get(Locale.Download, lang)}
            </ClickableContrastAnchor>
          </div>
          <div className="grow" />
          <div className="grow" />
        </div>
        <div className="grid place-items-stretch gap-4 grid-cols-[repeat(auto-fill,minmax(12rem,1fr))]">
          <InfoCard
            title="0 VC"
            href="/1"
            subtitle={`Fully crowdfunded by the community for the community. No grants. No VCs.`}>
            <OneDisplay />
          </InfoCard>
          <InfoCard
            title="Tor"
            href="/2"
            subtitle={`Built-in Tor to hide your IP address from third-parties. Each account has it's own IP.`}>
            <TwoDisplay />
          </InfoCard>
          <InfoCard
            title="~50"
            href="/3"
            subtitle={`Number of external dependencies. That's around 20x less than competitors.`}>
            <ThreeDisplay />
          </InfoCard>
          <InfoCard
            title="Auth"
            href="/4"
            subtitle={`You can use WebAuthn to authenticate and sign transactions. All your keys are stored encrypted.`}>
            <FourDisplay />
          </InfoCard>
          <InfoCard
            title="Truth"
            href="/5"
            subtitle={`Each request is sent to multiple servers to ensure no one lies about the blockchain state.`}>
            <FiveDisplay />
          </InfoCard>
          <InfoCard
            title="MIT"
            href="/6"
            subtitle={`All our code is MIT-licensed reproducible open-source. You can build it yourself.`}>
            <SixDisplay />
          </InfoCard>
        </div>
        <div className="h-16" />
        <div className="text-center text-2xl font-medium"
          id={subpath.go("/download").hash.slice(1)}>
          {Locale.get(Locale.Download, lang)}
        </div>
        <div className="h-8" />
        <div className="grid place-items-stretch gap-4 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
          <DownloadCard
            highlighted={navigator.userAgent.includes("Chrome") && !navigator.userAgent.includes("Android")}
            icon={Outline.ArrowTopRightOnSquareIcon}
            title="Chrome-like"
            src="/assets/browsers/chrome.png"
            href="https://chromewebstore.google.com/detail/brume-wallet/oljgnlammonjehmmfahdjgjhjclpockd">
            Chrome, Brave, Chromium, Edge, Opera, Vivaldi
          </DownloadCard>
          <DownloadCard
            highlighted={navigator.userAgent.includes("Firefox") && !navigator.userAgent.includes("Android")}
            icon={Outline.ArrowTopRightOnSquareIcon}
            title="Firefox-like"
            src="/assets/browsers/firefox.png"
            href="https://addons.mozilla.org/firefox/addon/brumewallet/">
            Firefox, Waterfox, Pale Moon, Basilisk, IceCat, IceWeasel
          </DownloadCard>
          <DownloadCard
            highlighted={navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome") && !navigator.userAgent.includes("Android")}
            icon={Outline.ArrowTopRightOnSquareIcon}
            title="Safari"
            src="/assets/browsers/safari.svg"
            href="https://testflight.apple.com/join/WtNNiY98">
            iOS, iPadOS, macOS
          </DownloadCard>
          <DownloadCard
            highlighted={navigator.userAgent.includes("Android")}
            icon={Outline.ArrowDownTrayIcon}
            title="Android"
            src="/assets/browsers/android.svg"
            href="https://github.com/brumewallet/wallet/raw/main/dist/android.apk">
            Google, Samsung, Huawei, Xiaomi, Oppo, Vivo
          </DownloadCard>
        </div>
        <div className="h-4" />
        <WideClickableContrastAnchor
          target="_blank" rel="noreferrer"
          href="https://github.com/brumewallet/wallet#usage">
          <Outline.ArrowTopRightOnSquareIcon className="size-5" />
          {Locale.get(Locale.MoreDownloads, lang)}
        </WideClickableContrastAnchor>
        <div className="h-[50vh]" />
        <div className="p-4 flex items-center justify-center gap-2">
          <TextAnchor
            target="_blank" rel="noreferrer"
            href="https://brume.money">
            {Locale.get(Locale.MadeByCypherpunks, lang)}
          </TextAnchor>
          <span>
            ·
          </span>
          <span>
            v{process.env.VERSION}
          </span>
        </div>
      </PageBody>
    </GlobalPage>
  </>
}

export function UsersMenu() {
  const lang = useLocaleContext().getOrThrow()
  const path = usePathContext().getOrThrow()

  const usersQuery = useUsers()
  const maybeUsers = usersQuery.current?.getOrNull()

  const create = useCoords(path, "/users/create")

  return <div className="flex flex-col text-left gap-2">
    {maybeUsers?.map(user =>
      <Fragment key={user.uuid}>
        <UsersMenuRow user={user} />
      </Fragment>)}
    <WideClickableNakedMenuAnchor
      onClick={create.onClick}
      onKeyDown={create.onKeyDown}
      href={create.href}>
      <div className="rounded-full size-7 flex justify-center items-center border border-contrast border-dashed">
        <Outline.PlusIcon className="size-4" />
      </div>
      {Locale.get(Locale.NewUser, lang)}
    </WideClickableNakedMenuAnchor>
  </div>
}

export function UsersMenuRow(props: { user: User }) {
  const path = usePathContext().getOrThrow()

  const userQuery = useUser(props.user.uuid)
  const maybeUser = userQuery.current?.getOrNull()

  const open = useCoords(path, urlOf("/users/login", { user: props.user.uuid }).href)

  if (maybeUser == null)
    return null

  return <WideClickableNakedMenuAnchor
    onClick={open.onClick}
    onKeyDown={open.onKeyDown}
    href={open.href}>
    <UserAvatar className="size-7 text-lg flex-none"
      color={Color.get(maybeUser.color)}
      name={maybeUser.name} />
    {maybeUser.name}
  </WideClickableNakedMenuAnchor>
}

export function InfoCard(props: TitleProps & SubtitleProps & ChildrenProps & AnchorProps & { href: string }) {
  const path = usePathContext().getOrThrow()
  const { children, title, subtitle, href, ...rest } = props

  const subpath = useHashSubpath(path)
  const genius = useCoords(subpath, href)

  return <>
    <HashSubpathProvider>
      {subpath.url.pathname === href &&
        <Dialog hesitant>
          <div className="text-6xl">
            {title}
          </div>
          <div className="h-2" />
          <div className="text-contrast">
            {subtitle}
          </div>
          <div className="h-8" />
          {children}
        </Dialog>}
    </HashSubpathProvider>
    <div className="p-6 aspect-square bg-contrast rounded-xl flex flex-col">
      <div className="text-6xl">
        {title}
      </div>
      <div className="h-4 grow" />
      <div className="">
        <span className="text-contrast">
          {subtitle}
        </span>
        <span>{` `}</span>
        <TextAnchor
          onClick={genius.onClick}
          onKeyDown={genius.onKeyDown}
          href={genius.href}
          {...rest}>
          Learn more.
        </TextAnchor>
      </div>
    </div>
  </>
}

export function DownloadCard(props: TitleProps & ChildrenProps & { href: string } & { src: string } & { highlighted?: boolean } & { icon: any }) {
  const lang = useLocaleContext().getOrThrow()
  const { href, src, children, title, highlighted = false, icon: Icon } = props

  const onClick = useCallback(() => {
    window.open(href, "_blank", "noreferrer")
  }, [href])

  return <div className="p-6 bg-contrast rounded-xl flex flex-col data-[highlighted=false]:opacity-50 transition-opacity"
    data-highlighted={highlighted}
    onClick={onClick}
    role="button">
    <div className="flex">
      <img className="size-24 object-contain"
        alt={title}
        src={src} />
      <div className="w-8" />
      <div className="flex flex-col">
        <div className="font-medium text-2xl">
          {title}
        </div>
        <div className="h-1" />
        <div className="text-contrast">
          {children}
        </div>
      </div>
    </div>
    <div className="h-4 grow" />
    <div className="flex items-center">
      <WideClickableContrastAnchor
        target="_blank" rel="noreferrer"
        onClick={Events.keep}
        href={href}>
        <Icon className="size-5" />
        {Locale.get(Locale.Download, lang)}
      </WideClickableContrastAnchor>
    </div>
  </div>
}