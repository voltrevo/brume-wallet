import { Outline } from "@/libs/icons"
import { OkProps } from "@/libs/react/props/promise"
import { PaddedRoundedClickableNakedAnchor } from "@/libs/ui/anchor"
import { Dialog } from "@/libs/ui/dialog"
import { Menu } from "@/libs/ui/menu"
import { PageBody, PageHeader } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { useLocaleContext } from "@/mods/foreground/global/mods/locale"
import { Locale } from "@/mods/foreground/locale"
import { UserGuardBody } from "@/mods/foreground/user/mods/guard"
import { Seed } from "@/mods/universal/entities/seeds"
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin"
import { Fragment, useCallback } from "react"
import { RectangularAnchorCard } from "../../wallets/all/page"
import { RawSeedDataCard } from "../card"
import { SeedDataProvider } from "../context"
import { useSeeds } from "../data"
import { SeedCreatorMenu } from "./create"
import { LedgerSeedCreatorDialog } from "./create/hardware"
import { StandaloneSeedCreatorDialog } from "./create/mnemonic"

export function SeedsPage() {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()

  const hash = useHashSubpath(path)

  const create = useCoords(hash, "/create")

  return <UserPage>
    <PageHeader title={Locale.get(Locale.Seeds, locale)}>
      <PaddedRoundedClickableNakedAnchor
        onKeyDown={create.onKeyDown}
        onClick={create.onClick}
        href={create.href}>
        <Outline.PlusIcon className="size-5" />
      </PaddedRoundedClickableNakedAnchor>
    </PageHeader>
    <div className="po-2 flex items-center">
      <div className="text-default-contrast">
        {Locale.get({
          en: `Seeds allow you to generate wallets from a single secret. You can import a seed from a mnemonic phrase or connect a hardware wallet.`,
          zh: `种子允许您从单个秘密生成钱包。您可以从助记短语导入种子，也可以连接硬件钱包。`,
          hi: `बीज आपको एक ही रहस्य से वॉलेट उत्पन्न करने की अनुमति देते हैं। आप एक म्नेमोनिक वाक्य से बीज आयात कर सकते हैं या हार्डवेयर वॉलेट कनेक्ट कर सकते हैं।`,
          es: `Las semillas le permiten generar billeteras a partir de un solo secreto. Puede importar una semilla desde una frase mnemotécnica o conectar una billetera de hardware.`,
          ar: `تسمح لك البذور بإنشاء محافظ من سر واحد. يمكنك استيراد بذرة من عبارة مذكرة أو توصيل محفظة عتاد.`,
          fr: `Les graines vous permettent de générer des portefeuilles à partir d'un seul secret. Vous pouvez importer une graine à partir d'une phrase mnémonique ou connecter un portefeuille matériel.`,
          de: `Samen ermöglichen es Ihnen, Geldbörsen aus einem einzigen Geheimnis zu generieren. Sie können einen Samen aus einer mnemonischen Phrase importieren oder eine Hardware-Brieftasche anschließen.`,
          ru: `Семена позволяют вам генерировать кошельки из одного секрета. Вы можете импортировать семя из мнемонической фразы или подключить аппаратный кошелек.`,
          pt: `As sementes permitem que você gere carteiras a partir de um único segredo. Você pode importar uma semente de uma frase mnemônica ou conectar uma carteira de hardware.`,
          ja: `シードを使用すると、1つの秘密からウォレットを生成できます。ニーモニックフレーズからシードをインポートしたり、ハードウェアウォレットを接続したりできます。`,
          pa: `ਬੀਜ ਤੁਹਾਨੂੰ ਇੱਕ ਹੀ ਰਾਜ ਤੋਂ ਵਾਲੇਟ ਬਣਾਉਣ ਦੀ ਆਗਿਆ ਦਿੰਦੇ ਹਨ। ਤੁਸੀਂ ਇੱਕ ਮਨੇਮੋਨਿਕ ਵਾਕਰੀ ਤੋਂ ਬੀਜ ਆਯਾਤ ਕਰ ਸਕਦੇ ਹੋ ਜਾਂ ਹਾਰਡਵੇਅਰ ਵਾਲੈਟ ਨਾਲ ਕੁਨੈਕਟ ਕਰ ਸਕਦੇ ਹੋ।`,
          bn: `বীজ আপনাকে একটি একল গোপনীয় থেকে ওয়ালেট তৈরি করতে দেয়। আপনি একটি মনেমোনিক বাক্য থেকে বীজ আমদানি করতে পারেন বা হার্ডওয়্যার ওয়ালেট সংযুক্ত করতে পারেন।`,
          id: `Benih memungkinkan Anda menghasilkan dompet dari satu rahasia. Anda dapat mengimpor benih dari frasa mnemonik atau menghubungkan dompet perangkat keras.`,
          ur: `بیج آپ کو ایک ہی راز سے والیٹ بنانے کی اجازت دیتے ہیں۔ آپ ایک میمونک فریز سے بیج درآمد کر سکتے ہیں یا ہارڈویئر والیٹ کنیکٹ کر سکتے ہیں۔`,
          ms: `Benih membolehkan anda menghasilkan dompet dari satu rahsia. Anda boleh mengimport benih dari frasa mnemonik atau menyambung dompet perkakasan.`,
          it: `I semi ti consentono di generare portafogli da un singolo segreto. Puoi importare un seme da una frase mnemonica o connettere un portafoglio hardware.`,
          tr: `Tohumlar size tek bir sırdan cüzdan oluşturmanızı sağlar. Bir tohumu bir mnemonik ifadeden içe aktarabilir veya bir donanım cüzdanı bağlayabilirsiniz.`,
          ta: `வித்திகள் ஒரு ரகசியத்திலிருந்து வாலட்களை உருவாக்க அனுமதிக்கும். நீங்கள் ஒரு நினைவு வாக்கியிலிருந்து வித்தியை இறக்கும் அல்லது ஒரு ஹார்ட்வேர் வாலட்டை இணைக்கலாம்.`,
          te: `సీడ్లు ఒక గుప్తం నుండి వాలెట్లను రూపొందించడంకు అనుమతిస్తాయి. మీరు మెమోనిక్ ఫ్రేజ్ నుండి సీడ్ను దిగుమతి చేయవచ్చు లేదా హార్డ్వేర్ వాలెట్ను కనెక్ట్ చేయవచ్చు.`,
          ko: `씨앗을 사용하면 하나의 비밀에서 지갑을 생성할 수 있습니다. 니모닉 문구에서 씨앗을 가져오거나 하드웨어 지갑을 연결할 수 있습니다.`,
          vi: `Hạt giúp bạn tạo ví từ một bí mật duy nhất. Bạn có thể nhập hạt từ cụm từ mnemonic hoặc kết nối ví phần cứng.`,
          pl: `Nasiona pozwalają generować portfele z jednego sekretu. Możesz zaimportować nasiono z frazy mnemotechnicznej lub podłączyć portfel sprzętowy.`,
          ro: `Semintele va permit sa generati portofele dintr-un singur secret. Puteti importa un seed dintr-o fraza mnemonica sau conecta un portofel hardware.`,
          nl: `Zaden stellen u in staat om portefeuilles te genereren vanuit een enkel geheim. U kunt een zaad importeren uit een mnemonische zin of een hardwareportefeuille aansluiten.`,
          el: `Οι σπόροι σας επιτρέπουν να δημιουργήσετε πορτοφόλια από ένα μόνο μυστικό. Μπορείτε να εισαγάγετε ένα σπόρο από μια μνημονική φράση ή να συνδέσετε ένα πορτοφόλι υλικού.`,
          th: `เมล็ดพันธุ์ช่วยให้คุณสร้างกระเป๋าเงินจากความลับเพียงหนึ่งเรื่อง คุณสามารถนำเมล็ดพันธุ์จากวลีจำเดียวหรือเชื่อมต่อกระเป๋าเงินฮาร์ดแวร์ได้`,
          cs: `Semena vám umožňují generovat peněženky z jednoho tajemství. Můžete importovat semeno z mnemotechnické fráze nebo připojit hardwarovou peněženku.`,
          hu: `A magok lehetővé teszik, hogy egyetlen titokból pénztárcákat generáljon. Egy magot importálhat egy mnemonikus frázisból vagy csatlakoztathat egy hardveres pénztárcát.`,
          sv: `Frön låter dig generera plånböcker från en enda hemlighet. Du kan importera ett frö från en mnemonisk fras eller ansluta en hårdvarupenna.`,
          da: `Frøene giver dig mulighed for at generere tegnebøger fra en enkelt hemmelighed. Du kan importere et frø fra en mnemonisk sætning eller tilslutte en hardwarepung.`,
        }, locale)}
      </div>
    </div>
    <UserGuardBody>
      <SeedsBody />
    </UserGuardBody>
  </UserPage>
}

export function SeedsBody() {
  const path = usePathContext().getOrThrow()

  const seedsQuery = useSeeds()
  const maybeSeeds = seedsQuery.data?.get()

  const hash = useHashSubpath(path)

  const onSeedClick = useCallback((seed: Seed) => {
    location.assign(`#/seed/${seed.uuid}`)
  }, [])

  return <PageBody>
    <HashSubpathProvider>
      {hash.url.pathname === "/create" &&
        <Menu>
          <SeedCreatorMenu />
        </Menu>}
      {hash.url.pathname === "/create/mnemonic" &&
        <Dialog>
          <StandaloneSeedCreatorDialog />
        </Dialog>}
      {hash.url.pathname === "/create/hardware" &&
        <Dialog>
          <LedgerSeedCreatorDialog />
        </Dialog>}
    </HashSubpathProvider>
    <ClickableSeedGrid
      ok={onSeedClick}
      maybeSeeds={maybeSeeds} />
  </PageBody>
}

export function ClickableSeedGrid(props: OkProps<Seed> & { maybeSeeds?: Seed[] } & { disableNew?: boolean }) {
  const { ok, maybeSeeds, disableNew } = props

  return <div className="grid grow place-content-start gap-2 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
    {maybeSeeds?.map(seed =>
      <Fragment key={seed.uuid}>
        <ClickableSeedCard
          seed={seed}
          ok={ok} />
      </Fragment>)}
    {!disableNew &&
      <RectangularAnchorCard>
        <Outline.PlusIcon className="size-5" />
      </RectangularAnchorCard>}
  </div>
}

export function ClickableSeedCard(props: { seed: Seed } & OkProps<Seed>) {
  const { seed, ok } = props

  const onClick = useCallback(() => {
    ok(seed)
  }, [ok, seed])

  return <div className={`w-full aspect-video rounded-xl overflow-hidden cursor-pointer hovered-or-clicked-or-focused:scale-105 !transition-transform`}
    role="button"
    onClick={onClick}>
    <SeedDataProvider uuid={seed.uuid}>
      <RawSeedDataCard />
    </SeedDataProvider>
  </div>
}
