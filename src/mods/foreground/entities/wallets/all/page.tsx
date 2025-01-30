/* eslint-disable @next/next/no-img-element */
import { Outline } from "@/libs/icons/icons"
import { ChildrenProps } from "@/libs/react/props/children"
import { OkProps } from "@/libs/react/props/promise"
import { PaddedRoundedClickableNakedAnchor, WideClickableContrastAnchor } from "@/libs/ui/anchor"
import { Dialog } from "@/libs/ui/dialog"
import { Menu } from "@/libs/ui/menu"
import { PageBody, PageHeader } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { useLocaleContext } from "@/mods/foreground/global/mods/locale"
import { Locale } from "@/mods/foreground/locale"
import { UserGuardBody } from "@/mods/foreground/user/mods/guard"
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin"
import { Nullable } from "@hazae41/option"
import { Fragment, useCallback } from "react"
import { RawWalletDataCard } from "../card"
import { WalletDataProvider } from "../context"
import { WalletProps, useTrashedWallets, useWallets } from "../data"
import { WalletCreatorMenu } from "./create"
import { ReadonlyWalletCreatorDialog } from "./create/readonly"
import { StandaloneWalletCreatorDialog } from "./create/standalone"

export function WalletsPage() {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()

  const hash = useHashSubpath(path)
  const create = useCoords(hash, "/create")

  return <UserPage>
    <PageHeader title={Locale.get(Locale.Wallets, locale)}>
      <PaddedRoundedClickableNakedAnchor
        onKeyDown={create.onKeyDown}
        onClick={create.onClick}
        href={create.href}>
        <Outline.PlusIcon className="size-5" />
      </PaddedRoundedClickableNakedAnchor>
    </PageHeader>
    <div className="p-4 text-default-contrast">
      {Locale.get({
        en: `Wallets allow you to hold funds and generate signatures. You can import wallets from a private key or generate them from a seed.`,
        zh: `钱包允许您持有资金并生成签名。您可以从私钥导入钱包或从种子生成钱包。`,
        hi: `वॉलेट आपको फंड रखने और हस्ताक्षर उत्पन्न करने की अनुमति देते हैं। आप एक निजी कुंजी से वॉलेट आयात कर सकते हैं या बीज से उन्हें उत्पन्न कर सकते हैं।`,
        es: `Las billeteras le permiten mantener fondos y generar firmas. Puede importar billeteras desde una clave privada o generarlas desde una semilla.`,
        ar: `تسمح لك المحافظ بالاحتفاظ بالأموال وتوليد التوقيعات. يمكنك استيراد المحافظ من مفتاح خاص أو توليدها من بذرة.`,
        fr: `Les portefeuilles vous permettent de conserver des fonds et de générer des signatures. Vous pouvez importer des portefeuilles à partir d'une clé privée ou les générer à partir d'une graine.`,
        de: `Wallets ermöglichen es Ihnen, Gelder zu halten und Signaturen zu generieren. Sie können Wallets aus einem privaten Schlüssel importieren oder aus einem Seed generieren.`,
        ru: `Кошельки позволяют вам хранить средства и генерировать подписи. Вы можете импортировать кошельки из частного ключа или генерировать их из семени.`,
        pt: `As carteiras permitem que você mantenha fundos e gere assinaturas. Você pode importar carteiras de uma chave privada ou gerá-las a partir de uma semente.`,
        ja: `ウォレットを使用すると、資金を保持し、署名を生成できます。プライベートキーからウォレットをインポートするか、シードから生成できます。`,
        pa: `ਵਾਲੈਟ ਤੁਹਾਨੂੰ ਫੰਡ ਰੱਖਣ ਅਤੇ ਸਾਇਨ ਉਤਪੰਨ ਕਰਨ ਦੀ ਅਨੁਮਤੀ ਦਿੰਦੀ ਹੈ। ਤੁਸੀਂ ਨਿਜੀ ਕੁੰਜੀ ਤੋਂ ਵਾਲੈਟ ਆਯਾਤ ਕਰ ਸਕਦੇ ਹੋ ਜਾਂ ਉਹਨਾਂ ਨੂੰ ਬੀਜ ਤੋਂ ਉਤਪੰਨ ਕਰ ਸਕਦੇ ਹੋ।`,
        bn: `ওয়ালেট আপনাকে অর্থ ধারণ করতে এবং স্বাক্ষর তৈরি করতে অনুমতি দেয়। আপনি একটি ব্যক্তিগত কী থেকে ওয়ালেট আমদানি করতে পারেন বা একটি বীজ থেকে তাদের উৎপন্ন করতে পারেন।`,
        id: `Dompet memungkinkan Anda menyimpan dana dan menghasilkan tanda tangan. Anda dapat mengimpor dompet dari kunci pribadi atau menghasilkannya dari benih.`,
        ur: `والٹ آپ کو فنڈ رکھنے اور امضاوں پیدا کرنے کی اجازت دیتے ہیں۔ آپ ایک نجی کلید سے والٹ لے سکتے ہیں یا انہیں بیج سے پیدا کر سکتے ہیں۔`,
        ms: `Dompet membolehkan anda menyimpan dana dan menghasilkan tandatangan. Anda boleh mengimport dompet dari kunci peribadi atau menghasilkannya dari benih.`,
        it: `I portafogli ti consentono di tenere i fondi e generare firme. Puoi importare portafogli da una chiave privata o generarli da un seed.`,
        tr: `Cüzdanlar, fonları tutmanıza ve imzalar oluşturmanıza olanak tanır. Cüzdanları özel bir anahtardan içe aktarabilir veya bir tohumdan oluşturabilirsiniz.`,
        ta: `வரவுகளை வைத்திருக்க மற்றும் கையொப்பம் உருவாக்க வரவுகள் உங்களுக்கு அனுமதிக்கும். நீங்கள் தனியார் விசையிலிருந்து வரவுகளை இறக்குமதி செய்யலாம் அல்லது விதையிலிருந்து அவைகளை உருவாக்கலாம்.`,
        te: `వాలెట్లు ధనాలను ఉంచడం మరియు సంతకాలను సృష్టించడం కోసం అనుమతిస్తాయి. మీరు ఒక ప్రైవేట్ కీ నుండి వాలెట్లను దిగుమతి చేయవచ్చు లేదా విత్తనానుండి సృష్టించవచ్చు.`,
        ko: `지갑을 사용하면 자금을 보유하고 서명을 생성할 수 있습니다. 개인 키에서 지갑을 가져 오거나 씨앗에서 생성할 수 있습니다.`,
        vi: `Ví tiền cho phép bạn giữ tiền và tạo chữ ký. Bạn có thể nhập ví từ một khóa riêng hoặc tạo chúng từ một hạt giống.`,
        pl: `Portfele pozwalają przechowywać środki i generować podpisy. Możesz importować portfele z klucza prywatnego lub generować je z nasion.`,
        ro: `Portofelele vă permit să dețineți fonduri și să generați semnături. Puteți importa portofele dintr-o cheie privată sau să le generați dintr-o sămânță.`,
        nl: `Portefeuilles stellen u in staat om fondsen te bewaren en handtekeningen te genereren. U kunt portefeuilles importeren vanuit een privésleutel of genereren vanuit een zaadje.`,
        el: `Οι πορτοφόλια σας επιτρέπουν να κρατάτε κεφάλαια και να δημιουργείτε υπογραφές. Μπορείτε να εισάγετε πορτοφόλια από έναν ιδιωτικό κλειδί ή να τα δημιουργήσετε από ένα σπόρο.`,
        th: `กระเป๋าเงินช่วยให้คุณเก็บเงินและสร้างลายเซ็น คุณสามารถนำเข้ากระเป๋าเงินจากคีย์ส่วนตัวหรือสร้างจากเมล็ดพันธุ์ได้`,
        cs: `Peněženky vám umožňují držet peníze a generovat podpisy. Můžete importovat peněženky z privátního klíče nebo je generovat ze semene.`,
        hu: `A pénztárcák lehetővé teszik a pénz és az aláírások generálását. Pénztárcákat importálhat egy privát kulcsból vagy generálhat egy magból.`,
        sv: `Plånböcker låter dig hålla pengar och generera signaturer. Du kan importera plånböcker från en privat nyckel eller generera dem från ett frö.`,
        da: `Tegnebøger giver dig mulighed for at holde penge og generere underskrifter. Du kan importere tegnebøger fra en privat nøgle eller generere dem fra et frø.`,
      }, locale)}
    </div>
    <UserGuardBody>
      <WalletsBody />
    </UserGuardBody>
  </UserPage>
}

export function WalletsBody() {
  const path = usePathContext().getOrThrow()

  const walletsQuery = useWallets()
  const maybeWallets = walletsQuery.current?.getOrNull()

  const trashedWalletsQuery = useTrashedWallets()
  const maybeTrashedWallets = trashedWalletsQuery.current?.getOrNull()

  const hash = useHashSubpath(path)

  const onWalletClick = useCallback((wallet: Wallet) => {
    location.assign(path.go(`/wallet/${wallet.uuid}`))
  }, [path])

  return <PageBody>
    <HashSubpathProvider>
      {hash.url.pathname === "/create" &&
        <Menu>
          <WalletCreatorMenu />
        </Menu>}
      {hash.url.pathname === "/create/standalone" &&
        <Dialog>
          <StandaloneWalletCreatorDialog />
        </Dialog>}
      {hash.url.pathname === "/create/readonly" &&
        <Dialog>
          <ReadonlyWalletCreatorDialog />
        </Dialog>}
    </HashSubpathProvider>
    <ClickableWalletGrid
      ok={onWalletClick}
      wallets={maybeWallets} />
    <div className="h-4" />
    {maybeTrashedWallets != null && maybeTrashedWallets.length > 0 &&
      <div className="flex items-center flex-wrap-reverse gap-2">
        <WideClickableContrastAnchor
          href="#/wallets/trash">
          <Outline.TrashIcon className="size-5" />
          Trash ({maybeTrashedWallets.length})
        </WideClickableContrastAnchor>
      </div>}
  </PageBody>
}

export function ClickableWalletGrid(props: OkProps<Wallet> & { wallets: Nullable<Wallet[]> } & { selected?: Wallet } & { disableNew?: boolean }) {
  const locale = useLocaleContext().getOrThrow()
  const { wallets, ok, disableNew } = props

  return <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {wallets?.map(wallet =>
      <Fragment key={wallet.uuid}>
        <ClickableWalletCard
          wallet={wallet}
          ok={ok} />
      </Fragment>)}
    {!disableNew &&
      <RectangularAnchorCard>
        <Outline.PlusIcon className="size-5" />
      </RectangularAnchorCard>}
  </div>
}

export function SelectableWalletGrid(props: OkProps<Wallet> & { wallets: Nullable<Wallet[]> } & { selecteds: Nullable<Wallet>[] } & { disableNew?: boolean }) {
  const locale = useLocaleContext().getOrThrow()
  const { wallets, ok, selecteds, disableNew } = props

  return <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {wallets?.map(wallet =>
      <Fragment key={wallet.uuid}>
        <CheckableWalletCard
          wallet={wallet}
          index={selecteds.indexOf(wallet)}
          ok={ok} />
      </Fragment>)}
    {!disableNew &&
      <RectangularAnchorCard>
        <Outline.PlusIcon className="size-5" />
      </RectangularAnchorCard>}
  </div>
}

export function CheckableWalletCard(props: WalletProps & OkProps<Wallet> & { index: number }) {
  const { wallet, ok, index } = props
  const checked = index !== -1

  const onClick = useCallback(() => {
    ok(wallet)
  }, [ok, wallet])

  return <div className={`w-full aspect-video rounded-xl overflow-hidden cursor-pointer aria-checked:outline aria-checked:outline-2 aria-checked:outline-blue-600 animate-vibrate-loop`}
    role="checkbox"
    aria-checked={checked}
    onClick={onClick}>
    <WalletDataProvider uuid={wallet.uuid}>
      <RawWalletDataCard index={index} />
    </WalletDataProvider>
  </div>
}

export function ClickableWalletCard(props: WalletProps & OkProps<Wallet>) {
  const { wallet, ok } = props

  const onClick = useCallback(() => {
    ok(wallet)
  }, [ok, wallet])

  return <div className={`w-full aspect-video rounded-xl overflow-hidden cursor-pointer hovered-or-clicked-or-focused:scale-105 !transition-transform`}
    role="button"
    onClick={onClick}>
    <WalletDataProvider uuid={wallet.uuid}>
      <RawWalletDataCard />
    </WalletDataProvider>
  </div>

}

export function RectangularAnchorCard(props: ChildrenProps) {
  const path = usePathContext().getOrThrow()
  const { children } = props

  const hash = useHashSubpath(path)
  const create = useCoords(hash, "/create")

  return <a className="po-2 w-full aspect-video rounded-xl flex gap-2 justify-center items-center border border-default-contrast border-dashed active:scale-90 transition-transform"
    onContextMenu={create.onContextMenu}
    onKeyDown={create.onKeyDown}
    onClick={create.onClick}
    href={create.href}>
    {children}
  </a>
}
