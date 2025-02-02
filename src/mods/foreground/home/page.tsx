/* eslint-disable @next/next/no-img-element */
import { useDisplayUsd } from "@/libs/fixed"
import { isWebsite } from "@/libs/platform/platform"
import { WideClickableContrastButton } from "@/libs/ui/button"
import { PageBody } from "@/libs/ui/page/header"
import { UserPage } from "@/libs/ui/page/page"
import { useBackgroundContext } from "@/mods/foreground/background/context"
import { useUserTotalPricedBalance } from "@/mods/universal/user/mods/balances/hooks"
import { useCallback, useEffect, useState } from "react"
import { useUserContext } from "../entities/users/context"
import { useLocaleContext } from "../global/mods/locale"
import { Locale } from "../locale"

export function HomePage() {
  const locale = useLocaleContext().getOrThrow()
  const userData = useUserContext().getOrThrow().getOrThrow()
  const background = useBackgroundContext().getOrThrow()

  const totalPricedBalanceQuery = useUserTotalPricedBalance()
  const totalPricedBalanceDisplay = useDisplayUsd(totalPricedBalanceQuery.data?.get(), locale)

  const [persisted, setPersisted] = useState<boolean>()

  const getPersisted = useCallback(async () => {
    setPersisted(await navigator.storage.persist())
  }, [])

  useEffect(() => {
    if (!isWebsite())
      return

    getPersisted()

    if (navigator.userAgent.toLowerCase().includes("firefox"))
      return

    const t = setInterval(getPersisted, 1000)
    return () => clearTimeout(t)
  }, [background, getPersisted])

  const [ignored, setIgnored] = useState(false)

  const onIgnoreClick = useCallback(() => {
    setIgnored(true)
  }, [])

  const Body =
    <PageBody>
      <div className="h-[max(24rem,100dvh_-_16rem)] flex-none flex flex-col items-center">
        <div className="grow" />
        <h1 className="flex flex-col gap-2 text-center text-6xl font-medium"
          data-dir={Locale.get(Locale.direction, locale)}>
          <div>
            {Locale.get(Locale.Hello, locale)}
          </div>
          <div className="text-default-contrast">
            {userData.name}
          </div>
        </h1>
        <div className="grow" />
        {!persisted && !ignored && <>
          <div className="h-4" />
          <div className="p-4 bg-default-contrast rounded-xl max-w-sm">
            <h3 className="font-medium text-center text-lg">
              {Locale.get({
                en: "Your data won't be saved",
                zh: "您的数据将不会被保存",
                hi: "आपका डेटा सेव नहीं होगा",
                es: "Sus datos no se guardarán",
                ar: "لن يتم حفظ بياناتك",
                fr: "Vos données ne seront pas sauvegardées",
                de: "Ihre Daten werden nicht gespeichert",
                ru: "Ваши данные не будут сохранены",
                pt: "Seus dados não serão salvos",
                ja: "データは保存されません",
                pa: "ਤੁਹਾਡੇ ਡਾਟਾ ਸੰਭਾਲਿਆ ਨਹੀਂ ਜਾਵੇਗਾ",
                bn: "আপনার ডেটা সংরক্ষিত হবে না",
                id: "Data Anda tidak akan disimpan",
                ur: "آپ کا ڈیٹا محفوظ نہیں ہوگا",
                ms: "Data anda tidak akan disimpan",
                it: "I tuoi dati non verranno salvati",
                tr: "Verileriniz kaydedilmeyecek",
                ta: "உங்கள் தரவு சேமிக்கப்படாது",
                te: "మీ డేటా సేవ్ కాలేదు",
                ko: "데이터가 저장되지 않습니다",
                vi: "Dữ liệu của bạn sẽ không được lưu",
                pl: "Twoje dane nie zostaną zapisane",
                ro: "Datele tale nu vor fi salvate",
                nl: "Uw gegevens worden niet opgeslagen",
                el: "Τα δεδομένα σας δεν θα αποθηκευτούν",
                th: "ข้อมูลของคุณจะไม่ถูกบันทึก",
                cs: "Vaše údaje nebudou uloženy",
                hu: "Az adataid nem lesznek mentve",
                sv: "Dina data kommer inte att sparas",
                da: "Dine data vil ikke blive gemt"
              }, locale)}
            </h3>
            <div className="h-2" />
            <p className="text-default-contrast text-center">
              {Locale.get({
                en: `Add this website to your favorites or to your home screen if you want to keep your data`,
                zh: `如果您想保留您的数据，请将此网站添加到收藏夹或主屏幕`,
                hi: `अपने डेटा को सुरक्षित रखना चाहते हैं तो इस वेबसाइट को अपने पसंदीदा या होम स्क्रीन में जोड़ें`,
                es: `Agregue este sitio web a sus favoritos o a su pantalla de inicio si desea mantener sus datos`,
                ar: `أضف هذا الموقع إلى المفضلة أو إلى شاشة البداية الخاصة بك إذا كنت ترغب في الاحتفاظ ببياناتك`,
                fr: `Ajoutez ce site à vos favoris ou à votre écran d'accueil si vous souhaitez conserver vos données`,
                de: `Fügen Sie diese Website zu Ihren Favoriten oder zu Ihrem Startbildschirm hinzu, wenn Sie Ihre Daten behalten möchten`,
                ru: `Добавьте этот сайт в избранное или на главный экран, если хотите сохранить свои данные`,
                pt: `Adicione este site aos seus favoritos ou à sua tela inicial se desejar manter seus dados`,
                ja: `データを保持したい場合は、このウェブサイトをお気に入りやホーム画面に追加してください`,
                pa: `ਜੇ ਤੁਸੀਂ ਆਪਣੇ ਡਾਟਾ ਨੂੰ ਰੱਖਣਾ ਚਾਹੁੰਦੇ ਹੋ ਤਾਂ ਇਸ ਵੈਬਸਾਈਟ ਨੂੰ ਆਪਣੇ ਪਸੰਦੀਦਾ ਜਾਂ ਹੋਮ ਸਕ੍ਰੀਨ ਵਿੱਚ ਸ਼ਾਮਲ ਕਰੋ`,
                bn: `আপনি যদি আপনার ডেটা রাখতে চান তবে আপনি এই ওয়েবসাইটটি আপনার প্রিয় বা হোম স্ক্রিনে যোগ করুন`,
                id: `Tambahkan situs web ini ke favorit Anda atau ke layar beranda Anda jika Anda ingin menyimpan data Anda`,
                ur: `آپ اپنے ڈیٹا کو محفوظ رکھنا چاہتے ہیں تو اس ویب سائٹ کو اپنے پسندیدہ یا ہوم اسکرین میں شامل کریں`,
                ms: `Tambahkan laman web ini ke kegemaran anda atau ke skrin utama anda jika anda ingin menyimpan data anda`,
                it: `Aggiungi questo sito ai preferiti o alla schermata iniziale se desideri mantenere i tuoi dati`,
                tr: `Verilerinizi saklamak istiyorsanız bu web sitesini favorilerinize veya ana ekranınıza ekleyin`,
                ta: `உங்கள் தரவை சேமிக்க விரும்பும் போது இந்த வலைதளத்தை உங்கள் பிடித்தவைக்கு அல்லது முதல் திரையில் சேர்க்கவும்`,
                te: `మీ డేటాను భద్రపరచడానికి ఈ వెబ్‌సైట్‌ను మీ ఇష్టపడే లేదా హోమ్ స్క్రీన్‌కు జోడించండి`,
                ko: `데이터를 보관하려면이 웹 사이트를 즐겨찾기 또는 홈 화면에 추가하십시오`,
                vi: `Thêm trang web này vào mục yêu thích của bạn hoặc vào màn hình chính nếu bạn muốn giữ lại dữ liệu của mình`,
                pl: `Aby zachować swoje dane, dodaj tę witrynę do ulubionych lub na ekran główny`,
                ro: `Pentru a vă păstra datele, adăugați acest site la favorite sau pe ecranul principal`,
                nl: `Voeg deze website toe aan uw favorieten of aan uw startscherm als u uw gegevens wilt bewaren`,
                el: `Προσθέστε αυτόν τον ιστότοπο στα αγαπημένα σας ή στην αρχική οθόνη σας αν θέλετε να διατηρήσετε τα δεδομένα σας`,
                th: `หากคุณต้องการเก็บข้อมูลของคุณให้เพิ่มเว็บไซต์นี้ในรายการโปรดหรือในหน้าจอหลักของคุณ`,
                cs: `Pokud chcete uchovat svá data, přidejte tuto webovou stránku do oblíbených nebo na domovskou obrazovku`,
                hu: `Ha meg akarja őrizni az adatait, adja hozzá ezt a webhelyet a kedvenceihez vagy a kezdőképernyőjéhez`,
                sv: `Lägg till denna webbplats i dina favoriter eller på din startsida om du vill behålla dina data`,
                da: `Hvis du vil beholde dine data, skal du tilføje dette websted til dine favoritter eller din startskærm`
              }, locale)}
            </p>
            <div className="h-4" />
            <div className="flex items-center flex-wrap-reverse gap-2">
              <WideClickableContrastButton
                onClick={onIgnoreClick}>
                {Locale.get(Locale.IDontCare, locale)}
              </WideClickableContrastButton>
            </div>
          </div>
          <div className="h-4" />
        </>}
        <div className="grow" />
        <div className="grow" />
      </div>
      <div className="text-lg font-medium">
        {Locale.get({
          en: "Total balance",
          zh: "总余额",
          hi: "कुल शेष",
          es: "Saldo total",
          ar: "الرصيد الإجمالي",
          fr: "Solde total",
          de: "Gesamtguthaben",
          ru: "Общий баланс",
          pt: "Saldo total",
          ja: "合計残高",
          pa: "ਕੁੱਲ ਬੈਲੈਂਸ",
          bn: "মোট ব্যালেন্স",
          id: "Total saldo",
          ur: "کل بیلنس",
          ms: "Baki keseluruhan",
          it: "Saldo totale",
          tr: "Toplam bakiye",
          ta: "மொத்த இருப்பு",
          te: "మొత్తం బ్యాలెన్స్",
          ko: "총 잔액",
          vi: "Tổng số dư",
          pl: "Całkowity bilans",
          ro: "Sold total",
          nl: "Totaal saldo",
          el: "Συνολικό υπόλοιπο",
          th: "ยอดคงเหลือรวม",
          cs: "Celkový zůstatek",
          hu: "Teljes egyenleg",
          sv: "Totalt saldo",
          da: "Total balance"
        }, locale)}
      </div>
      <div className="text-2xl font-bold">
        {totalPricedBalanceDisplay}
      </div>
      <div className="h-4" />
      <div className="p-4 bg-default-contrast flex-none h-[300px] rounded-xl flex flex-col items-center justify-center">
        <img src="/favicon.png" alt="logo" className="h-24 w-auto" />
        <div className="">
          {Locale.get(Locale.ComingSoon, locale)}...
        </div>
      </div>
    </PageBody >

  return <UserPage>
    {Body}
  </UserPage>
}