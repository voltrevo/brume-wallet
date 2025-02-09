/* eslint-disable @next/next/no-img-element */
import { Color } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { Events } from "@/libs/react/events";
import { ChildrenProps } from "@/libs/react/props/children";
import { AnchorProps } from "@/libs/react/props/html";
import { SubtitleProps, TitleProps } from "@/libs/react/props/title";
import { ClickableContrastAnchor, ClickableOppositeAnchor, TextAnchor, WideClickableContrastAnchor, WideClickableNakedMenuAnchor } from "@/libs/ui/anchor";
import { Dialog } from "@/libs/ui/dialog";
import { Floor } from "@/libs/ui/floor";
import { Loading } from "@/libs/ui/loading";
import { Menu } from "@/libs/ui/menu";
import { PageBody } from "@/libs/ui/page/header";
import { GlobalPage } from "@/libs/ui/page/page";
import { urlOf } from "@/libs/url/url";
import { User } from "@/mods/background/service_worker/entities/users/data";
import { Two } from "@/mods/foreground/landing/2";
import { Three } from "@/mods/foreground/landing/3";
import { Four } from "@/mods/foreground/landing/4";
import { Five } from "@/mods/foreground/landing/5";
import { Six } from "@/mods/foreground/landing/6";
import { UserAvatar } from "@/mods/foreground/user/mods/avatar";
import { Topbar } from "@/pages";
import { HashSubpathProvider, useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin";
import { Fragment, useCallback } from "react";
import { UserCreateDialog } from "../entities/users/all/create";
import { useCurrentUser, useUser, useUsers } from "../entities/users/data";
import { UserLoginDialog } from "../entities/users/login";
import { useLocaleContext } from "../global/mods/locale";
import { Locale } from "../locale";
import { GlobalBottomNavigation } from "../overlay/bottom";
import { One } from "./1";

export function EmptyLandingPage(props: { next?: string }) {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const { next } = props

  const currentUserQuery = useCurrentUser()
  const currentUserLoading = !currentUserQuery.ready
  const maybeCurrentUser = currentUserQuery.current?.getOrNull()

  const userQuery = useUser(maybeCurrentUser?.uuid)
  const maybeUser = userQuery.current?.getOrNull()

  const hash = useHashSubpath(path)
  const users = useCoords(hash, "/users")

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === "/users/login" &&
        <Dialog>
          <UserLoginDialog next={next} />
        </Dialog>}
      {hash.url.pathname === "/users/create" &&
        <Dialog>
          <UserCreateDialog next={next} />
        </Dialog>}
      {hash.url.pathname === "/users" &&
        <Menu>
          <UsersMenu />
        </Menu>}
    </HashSubpathProvider>
    <GlobalPage>
      <PageBody>
        <div className="h-[max(24rem,100dvh_-_16rem)] flex-none flex flex-col items-center">
          <div className="grow" />
          <h1 className="flex flex-col gap-2 text-center text-6xl font-medium"
            data-dir={Locale.get(Locale.direction, locale)}>
            <div>
              {Locale.get(Locale.Hello, locale)}
            </div>
            <div className="text-default-contrast">
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
                {Locale.get(Locale.Enter, locale)}
              </ClickableOppositeAnchor>}
            {!currentUserLoading && maybeCurrentUser != null &&
              <ClickableOppositeAnchor
                href="#/home">
                <Outline.HomeIcon className="size-5" />
                {Locale.get(Locale.Home, locale)}
              </ClickableOppositeAnchor>}
          </div>
          <div className="grow" />
        </div>
      </PageBody>
    </GlobalPage>
  </>
}

export function FullLandingPage(props: { next?: string }) {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const { next } = props

  const currentUserQuery = useCurrentUser()
  const currentUserLoading = !currentUserQuery.ready
  const maybeCurrentUser = currentUserQuery.data?.get()

  const hash = useHashSubpath(path)
  const users = useCoords(hash, "/users")

  const LocalizedOne = Locale.get(One, locale)
  const LocalizedTwo = Locale.get(Two, locale)
  const LocalizedThree = Locale.get(Three, locale)
  const LocalizedFour = Locale.get(Four, locale)
  const LocalizedFive = Locale.get(Five, locale)
  const LocalizedSix = Locale.get(Six, locale)

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === "/users/login" &&
        <Dialog>
          <UserLoginDialog next={next} />
        </Dialog>}
      {hash.url.pathname === "/users/create" &&
        <Floor>
          <UserCreateDialog next={next} />
        </Floor>}
      {hash.url.pathname === "/users" &&
        <Menu>
          <UsersMenu />
        </Menu>}
      {hash.url.pathname === "/install/iphone" &&
        <Dialog>
          <IphoneInstallDialog />
        </Dialog>}
      {hash.url.pathname === "/install/android" &&
        <Dialog>
          <AndroidInstallDialog />
        </Dialog>}
    </HashSubpathProvider>
    <Topbar />
    <GlobalPage>
      <PageBody>
        <div className="h-[max(24rem,100dvh_-_16rem)] flex-none flex flex-col items-center">
          <div className="grow" />
          <h1 className="text-center text-6xl font-medium">
            {Locale.get({
              en: "The private Ethereum wallet",
              zh: "私人以太坊钱包",
              hi: "निजी ईथेरियम वॉलेट",
              es: "La billetera Ethereum privada",
              ar: "محفظة إيثريوم الخاصة",
              fr: "Le portefeuille Ethereum confidentiel",
              de: "Die private Ethereum-Brieftasche",
              ru: "Частный кошелек Ethereum",
              pt: "A carteira Ethereum privada",
              ja: "プライベートイーサリアムウォレット",
              pa: "ਨਿਜੀ ਇਥੇਰੀਅਮ ਵਾਲੇਟ",
              bn: "ব্যক্তিগত ইথেরিয়াম ওয়ালেট",
              id: "Dompet Ethereum pribadi",
              ur: "نجی ایتھیریم والیٹ",
              ms: "Dompet Ethereum peribadi",
              it: "Il portafoglio Ethereum privato",
              tr: "Özel Ethereum cüzdanı",
              ta: "தனிப்பட்ட எதீரியம் வாலட்",
              te: "ప్రైవేట్ ఎథిరియం వాలెట్",
              ko: "개인 이더리움 지갑",
              vi: "Ví Ethereum riêng",
              pl: "Prywatny portfel Ethereum",
              ro: "Portofelul privat Ethereum",
              nl: "De privé Ethereum-portemonnee",
              el: "Το ιδιωτικό πορτοφόλι Ethereum",
              th: "กระเป๋าเงิน Ethereum ส่วนตัว",
              cs: "Soukromá peněženka Ethereum",
              hu: "A privát Ethereum tárca",
              sv: "Den privata Ethereum-plånboken",
              da: "Den private Ethereum-tegnebog",
            }, locale)}
          </h1>
          <div className="h-4" />
          <div className="text-center text-default-contrast text-2xl">
            {Locale.get({
              en: "Meet the only Ethereum wallet with maximum privacy and security.",
              zh: "了解唯一具有最大隐私和安全性的以太坊钱包。",
              hi: "अधिकतम गोपनीयता और सुरक्षा के साथ एकमात्र ईथेरियम वॉलेट से मिलें।",
              es: "Conozca la única billetera Ethereum con máxima privacidad y seguridad.",
              ar: "تعرف على المحفظة الوحيدة للإيثريوم بأقصى درجات الخصوصية والأمان.",
              fr: "Découvrez le seul portefeuille Ethereum avec une confidentialité et une sécurité maximales.",
              de: "Lernen Sie die einzige Ethereum-Brieftasche mit maximaler Privatsphäre und Sicherheit kennen.",
              ru: "Познакомьтесь с единственным кошельком Ethereum с максимальной конфиденциальностью и безопасностью.",
              pt: "Conheça a única carteira Ethereum com máxima privacidade e segurança.",
              ja: "最大限のプライバシーとセキュリティを備えた唯一のイーサリアムウォレットに会いましょう。",
              pa: "ਸਭ ਤੋਂ ਜ਼ਿਆਦਾ ਗੁਪਤਤਾ ਅਤੇ ਸੁਰੱਖਿਆ ਵਾਲਾ ਇਕ ਮਾਤਰ ਇਥੇਰੀਅਮ ਵਾਲੇਟ ਨਾਲ ਮਿਲੋ।",
              bn: "সর্বোচ্চ গোপনীয়তা এবং নিরাপত্তা সহ একমাত্র ইথেরিয়াম ওয়ালেট সাথে পরিচিত হন।",
              id: "Temui satu-satunya dompet Ethereum dengan privasi dan keamanan maksimum.",
              ur: "سب سے زیادہ رازداری اور حفاظت کے ساتھ ایک ہی ایتھیریم والیٹ سے ملیں۔",
              ms: "Kenali dompet Ethereum tunggal dengan privasi dan keselamatan maksimum.",
              it: "Incontra l'unico portafoglio Ethereum con massima privacy e sicurezza.",
              tr: "Maksimum gizlilik ve güvenlikle tek Ethereum cüzdanıyla tanışın.",
              ta: "அதிகப் பிரைவசி மற்றும் பாதுகாப்புடன் ஒரு இதீரியம் வாலட் சந்திக்கவும்.",
              te: "అత్యధిక గోప్యత మరియు భద్రతతో ఒకే ఎథిరియం వాలెట్తో కలిగించుకోండి.",
              ko: "최대 개인 정보 보호 및 보안을 갖춘 유일한 이더리움 지갑을 만나보세요.",
              vi: "Hãy gặp ví Ethereum duy nhất với độ riêng tư và bảo mật tối đa.",
              pl: "Poznaj jedyny portfel Ethereum z maksymalną prywatnością i bezpieczeństwem.",
              ro: "Întâlniți singurul portofel Ethereum cu maximă confidențialitate și securitate.",
              nl: "Maak kennis met de enige Ethereum-portemonnee met maximale privacy en veiligheid.",
              el: "Γνωρίστε το μοναδικό πορτοφόλι Ethereum με μέγιστη απορρήτου και ασφάλεια.",
              th: "พบกับกระเป๋าเงิน Ethereum เพียงหนึ่งเดียวที่มีความเป็นส่วนตัวและปลอดภัยสูงสุด",
              cs: "Seznamte se s jedinou peněženkou Ethereum s maximální soukromí a bezpečností.",
              hu: "Ismerje meg az egyetlen Ethereum pénztárcát maximális adatvédelemmel és biztonsággal.",
              sv: "Möt den enda Ethereum-plånboken med maximal integritet och säkerhet.",
              da: "Mød den eneste Ethereum-tegnebog med maksimal privatliv og sikkerhed.",
            }, locale)}
          </div>
          <div className="grow" />
          <div className="flex items-center">
            {currentUserLoading &&
              <ClickableOppositeAnchor
                aria-disabled>
                <Loading className="size-5" />
                {Locale.get(Locale.Loading, locale)}
              </ClickableOppositeAnchor>}
            {!currentUserLoading && maybeCurrentUser == null &&
              <ClickableOppositeAnchor
                onKeyDown={users.onKeyDown}
                onClick={users.onClick}
                href={users.href}>
                <Outline.LockOpenIcon className="size-5" />
                {Locale.get(Locale.Enter, locale)}
              </ClickableOppositeAnchor>}
            {!currentUserLoading && maybeCurrentUser != null &&
              <ClickableOppositeAnchor
                href="#/home">
                <Outline.HomeIcon className="size-5" />
                {Locale.get(Locale.Home, locale)}
              </ClickableOppositeAnchor>}
            <div className="w-2" />
            <ClickableContrastAnchor
              href={hash.go("/download").href}>
              <Outline.ArrowDownTrayIcon className="size-5" />
              {Locale.get(Locale.Download, locale)}
            </ClickableContrastAnchor>
          </div>
          <div className="grow" />
          <div className="grow" />
        </div>
        <div className="grid place-items-stretch gap-4 grid-cols-[repeat(auto-fill,minmax(12rem,1fr))]">
          <InfoCard
            title="0 VC"
            href="/1"
            subtitle={Locale.get({
              en: `Fully crowdfunded by the community for the community. No grants. No VCs.`,
              zh: `完全由社区为社区众筹。没有赠款。没有风投。`,
              hi: `समुदाय के लिए समुदाय द्वारा पूरी तरह से क्राउडफंडेड। कोई सब्सिडी नहीं। कोई वीसी नहीं।`,
              es: `Totalmente financiado por la comunidad para la comunidad. Sin subvenciones. Sin VCs.`,
              ar: `تمويل كامل من قبل المجتمع للمجتمع. لا منح. لا VCs.`,
              fr: `Entièrement financé par la communauté pour la communauté. Pas de subventions. Pas de VCs.`,
              de: `Vollständig von der Gemeinschaft für die Gemeinschaft finanziert. Keine Zuschüsse. Keine VCs.`,
              ru: `Полностью краудфандингом сообществом для сообщества. Нет грантов. Нет ВК.`,
              pt: `Totalmente financiado pela comunidade para a comunidade. Sem subsídios. Sem VCs.`,
              ja: `コミュニティによってコミュニティのために完全にクラウドファンディングされました。助成金なし。VCなし。`,
              pa: `ਸਮੂਹ ਲਈ ਸਮੂਹ ਦੁਆਰਾ ਪੂਰੀ ਤਰ੍ਹਾਂ ਕਰੌਡਫੰਡਿੰਗ ਕੀਤੀ ਗਈ। ਕੋਈ ਗ੍ਰਾਂਟ ਨਹੀਂ। ਕੋਈ ਵੀਸੀ ਨਹੀਂ।`,
              bn: `সম্প্রদায়ের জন্য সম্প্রদায় দ্বারা পূর্ণভাবে ক্রাউডফান্ড। কোন অনুদান নেই। কোন ভি. সি. নেই।`,
              id: `Sepenuhnya didanai oleh komunitas untuk komunitas. Tidak ada hibah. Tidak ada VC.`,
              ur: `کمیونٹی کے لیے کمیونٹی کی طرف سے مکمل طور پر کراؤڈفنڈ کیا گیا۔ کوئی گرانٹ نہیں۔ کوئی وی سی نہیں۔`,
              ms: `Sepenuhnya didanai oleh komuniti untuk komuniti. Tiada geran. Tiada VC.`,
              it: `Totalmente finanziato dalla comunità per la comunità. Nessun contributo. Nessun VC.`,
              tr: `Topluluk için topluluk tarafından tamamen kitle fonlaması yapıldı. Hiçbir hibe yok. Hiçbir VC yok.`,
              ta: `சமூகத்திற்கு சமூகத்தால் முழுவதும் குழுநிதிப்படுத்தப்பட்டது. பொதுவாகவே இல்லை. விசி இல்லை.`,
              te: `సముదాయంకి సముదాయం ద్వారా పూర్తిగా క్రౌడ్‌ఫండింగ్ చేయబడింది. సబ్సిడీ లేదు. వీసీలేదు.`,
              ko: `커뮤니티를 위해 커뮤니티에 의해 완전히 크라우드 펀딩되었습니다. 보조금 없음. VC 없음.`,
              vi: `Hoàn toàn được cộng đồng tài trợ cho cộng đồng. Không có hỗ trợ. Không có VC.`,
              pl: `Całkowicie sfinansowany przez społeczność dla społeczności. Bez dotacji. Bez VC.`,
              ro: `Total finanțat de comunitate pentru comunitate. Fără granturi. Fără VC.`,
              nl: `Volledig gefinancierd door de gemeenschap voor de gemeenschap. Geen subsidies. Geen VCs.`,
              el: `Πλήρως χρηματοδοτούμενο από την κοινότητα για την κοινότητα. Χωρίς υποτροφίες. Χωρίς VCs.`,
              th: `ได้รับการสนับสนุนโดยชุมชนสำหรับชุมชน ไม่มีทุน ไม่มี VC`,
              cs: `Plně crowdfunded komunitou pro komunitu. žádné granty. žádné VCs.`,
              hu: `Teljesen közösségi finanszírozás a közösség számára. Nincs támogatás. Nincs VC.`,
              sv: `Helt finansierad av gemenskapen för gemenskapen. Inga bidrag. Inga VC.`,
              da: `Fuldt finansieret af samfundet for samfundet. Ingen bevillinger. Ingen VC.`,
            }, locale)}>
            <LocalizedOne />
          </InfoCard>
          <InfoCard
            title="Tor"
            href="/2"
            subtitle={Locale.get({
              en: `Built-in Tor to hide your IP address from third-parties. Each account has it's own IP.`,
              zh: `内置 Tor 以隐藏您的 IP 地址免受第三方侵犯。每个帐户都有自己的 IP。`,
              hi: `तिसरे पक्षों से अपने आईपी पते को छुपाने के लिए बिल्ट-इन टोर। प्रत्येक खाते का अपना आईपी है।`,
              es: `Tor integrado para ocultar su dirección IP de terceros. Cada cuenta tiene su propia IP.`,
              ar: `Tor المدمج لإخفاء عنوان IP الخاص بك من الأطراف الثالثة. كل حساب له عنوان IP خاص به.`,
              fr: `Tor intégré pour masquer votre adresse IP aux tiers. Chaque compte a sa propre adresse IP.`,
              de: `Eingebautes Tor, um Ihre IP-Adresse vor Dritten zu verbergen. Jedes Konto hat seine eigene IP.`,
              ru: `Встроенный Tor для скрытия вашего IP-адреса от третьих лиц. У каждого аккаунта свой IP.`,
              pt: `Tor integrado para ocultar seu endereço IP de terceiros. Cada conta tem seu próprio IP.`,
              ja: `第三者からIPアドレスを隠すための組み込みTor。各アカウントには独自のIPがあります。`,
              pa: `ਤੀਜੇ ਪਾਰਟੀਆਂ ਤੋਂ ਆਪਣਾ ਆਈਪੀ ਪਤਾ ਛੁਪਾਉਣ ਲਈ ਬਿਲਡ-ਇਨ ਟੋਰ। ਹਰ ਖਾਤੇ ਦਾ ਆਪਣਾ ਆਈਪੀ ਹੈ।`,
              bn: `তৃতীয় পক্ষগুলি থেকে আপনার আইপি ঠিকানা লুকানোর জন্য নির্মিত Tor। প্রতিটি অ্যাকাউন্টের নিজস্ব আইপি আছে।`,
              id: `Tor bawaan untuk menyembunyikan alamat IP Anda dari pihak ketiga. Setiap akun memiliki IP sendiri.`,
              ur: `تیسری طرفوں سے اپنا آئی پی پتہ چھپانے کے لئے بلٹ-ان ٹور۔ ہر اکاؤنٹ کا اپنا آئی پی ہے۔`,
              ms: `Tor yang disertakan untuk menyembunyikan alamat IP anda daripada pihak ketiga. Setiap akaun mempunyai IP sendiri.`,
              it: `Tor integrato per nascondere il tuo indirizzo IP dai terzi. Ogni account ha il suo IP.`,
              tr: `Üçüncü taraflardan IP adresinizi gizlemek için yerleşik Tor. Her hesabın kendi IP'si vardır.`,
              ta: `மூன்றாம் தரவுகளிலிருந்து உங்கள் ஐபி முகவரியை மறைக்க உள்ள Tor உள்ளது. ஒவ்வொரு கணக்கும் தனது ஐபி உள்ளது.`,
              te: `మూడవ పార్టీల నుండి మీ ఐపీ చిరునామాను దాచేయడానికి అంతర్నిహితంగా ఉండిన Tor. ప్రతి ఖాతాలో తన ఐపీ ఉంది.`,
              ko: `타사로부터 IP 주소를 숨기기 위한 내장 Tor. 각 계정에는 고유한 IP가 있습니다.`,
              vi: `Tor tích hợp để ẩn địa chỉ IP của bạn khỏi bên thứ ba. Mỗi tài khoản đều có IP riêng.`,
              pl: `Wbudowany Tor, aby ukryć swój adres IP przed osobami trzecimi. Każde konto ma własne IP.`,
              ro: `Tor încorporat pentru a ascunde adresa IP de la terți. Fiecare cont are propriul său IP.`,
              nl: `Ingebouwde Tor om uw IP-adres te verbergen voor derden. Elk account heeft zijn eigen IP.`,
              el: `Ενσωματωμένο Tor για να κρύψετε τη διεύθυνση IP σας από τρίτους. Κάθε λογαριασμός έχει το δικό του IP.`,
              th: `Tor ที่ซ่อนที่อยู่ IP จากฝ่ายที่สาม แต่ละบัญชีมี IP ของตัวเอง`,
              cs: `Vestavěný Tor na skrytí vaší IP adresy před třetími stranami. Každý účet má svou vlastní IP.`,
              hu: `Beépített Tor az IP-cím elrejtéséhez harmadik fél elől. Minden fióknak saját IP-címe van.`,
              sv: `Inbyggd Tor för att dölja din IP-adress från tredje part. Varje konto har sin egen IP.`,
              da: `Indbygget Tor til at skjule din IP-adresse fra tredjeparter. Hver konto har sin egen IP.`,
            }, locale)}>
            <LocalizedTwo />
          </InfoCard>
          <InfoCard
            title="~50"
            href="/3"
            subtitle={Locale.get({
              en: `Number of external dependencies. That's around 20x less than competitors.`,
              zh: `外部依赖项的数量。这大约是竞争对手的 20 倍。`,
              hi: `बाहरी आधारों की संख्या। यह लगभग प्रतियोगियों की 20 गुणा है।`,
              es: `Número de dependencias externas. Eso es alrededor de 20 veces menos que los competidores.`,
              ar: `عدد التبعيات الخارجية. هذا حوالي 20 مرة أقل من المنافسين.`,
              fr: `Nombre de dépendances externes. C'est environ 20 fois moins que les concurrents.`,
              de: `Anzahl der externen Abhängigkeiten. Das ist etwa 20-mal weniger als bei Mitbewerbern.`,
              ru: `Количество внешних зависимостей. Это примерно в 20 раз меньше, чем у конкурентов.`,
              pt: `Número de dependências externas. Isso é cerca de 20 vezes menos do que os concorrentes.`,
              ja: `外部依存関係の数。これは競合他社の約20倍です。`,
              pa: `ਬਾਹਰੀ ਆਧਾਰਾਂ ਦੀ ਗਿਣਤੀ। ਇਹ ਲਗਭਗ ਪ੍ਰਤਿਸਪਰਧਾਰਾਂ ਤੋਂ 20 ਗੁਣਾ ਘੱਟ ਹੈ।`,
              bn: `বাহ্যিক নির্ভরণী সংখ্যা। এটা প্রাতিযোগিতাদারদের প্রায় 20 গুণ কম।`,
              id: `Jumlah dependensi eksternal. Itu sekitar 20 kali lebih sedikit dari pesaing.`,
              ur: `بیرونی وابستگیوں کی تعداد۔ یہ تقریباً مقابلین کی 20 گنا کم ہے۔`,
              ms: `Bilangan ketergantungan luaran. Itu kira-kira 20 kali kurang daripada pesaing.`,
              it: `Numero di dipendenze esterne. È circa 20 volte meno dei concorrenti.`,
              tr: `Dış bağımlılıkların sayısı. Bu, rakiplerden yaklaşık 20 kat daha azdır.`,
              ta: `வெற்றிகரமாக பயன்படுத்தப்படும் வெற்றிகரமான சேவைகளின் எண்ணிக்கை. இது போட்டியாக 20 மட்டுமே குடிக்கும்.`,
              te: `బాహ్య ఆధారాల సంఖ్య. అది ప్రత్యామ్పుల నుండి సుమారుగా 20 సార్లు తక్కువవి.`,
              ko: `외부 종속성의 수. 이는 경쟁 업체의 약 20 배입니다.`,
              vi: `Số lượng phụ thuộc bên ngoài. Đó là khoảng 20 lần ít hơn so với đối thủ.`,
              pl: `Liczba zewnętrznych zależności. To około 20 razy mniej niż u konkurentów.`,
              ro: `Numărul de dependențe externe. Acesta este de aproximativ 20 de ori mai mic decât al competitorilor.`,
              nl: `Aantal externe afhankelijkheden. Dat is ongeveer 20 keer minder dan concurrenten.`,
              el: `Αριθμός εξωτερικών εξαρτήσεων. Αυτό είναι περίπου 20 φορές λιγότερο από τους ανταγωνιστές.`,
              th: `จำนวนของการขึ้นอยู่กับภายนอก นั้นประมาณ 20 เท่าของคู่แข่ง`,
              cs: `Počet externích závislostí. To je asi 20krát méně než u konkurentů.`,
              hu: `Külső függőségek száma. Ez körülbelül 20-szor kevesebb, mint a versenytársaknál.`,
              sv: `Antal externa beroenden. Det är cirka 20 gånger mindre än konkurrenterna.`,
              da: `Antal eksterne afhængigheder. Det er cirka 20 gange mindre end konkurrenterne.`,
            }, locale)}>
            <LocalizedThree />
          </InfoCard>
          <InfoCard
            title="Auth"
            href="/4"
            subtitle={Locale.get({
              en: `You can use WebAuthn to authenticate and sign transactions. All your keys are stored encrypted.`,
              zh: `您可以使用 WebAuthn 进行身份验证和签署交易。所有密钥都以加密形式存储。`,
              hi: `आप WebAuthn का उपयोग करके प्रमाणीकरण और लेन-देन के लिए हस्ताक्षर कर सकते हैं। सभी आपके कुंजी एन्क्रिप्टेड रूप में संग्रहित हैं।`,
              es: `Puede utilizar WebAuthn para autenticar y firmar transacciones. Todas sus claves se almacenan encriptadas.`,
              ar: `يمكنك استخدام WebAuthn للمصادقة وتوقيع المعاملات. يتم تخزين جميع مفاتيحك مشفرة.`,
              fr: `Vous pouvez utiliser WebAuthn pour vous authentifier et signer des transactions. Toutes vos clés sont stockées cryptées.`,
              de: `Sie können WebAuthn verwenden, um sich zu authentifizieren und Transaktionen zu signieren. Alle Ihre Schlüssel werden verschlüsselt gespeichert.`,
              ru: `Вы можете использовать WebAuthn для аутентификации и подписи транзакций. Все ваши ключи хранятся в зашифрованном виде.`,
              pt: `Você pode usar o WebAuthn para autenticar e assinar transações. Todas as suas chaves são armazenadas criptografadas.`,
              ja: `WebAuthn を使用して認証およびトランザクションに署名できます。すべてのキーは暗号化されて保存されます。`,
              pa: `ਤੁਸੀਂ WebAuthn ਦੀ ਵਰਤੋਂ ਕਰ ਸਕਦੇ ਹੋ ਅਤੇ ਲੇਨ-ਦੇਨ ਦੀ ਪੁਸ਼ਟੀ ਕਰਨ ਲਈ। ਤੁਹਾਡੀ ਸਭ ਤੋਂ ਕੁੰਜੀਆਂ ਇੰਕ੍ਰਿਪਟ ਕੀਤੀ ਹੋਈਆਂ ਹਨ।`,
              bn: `আপনি ওয়েবআথন ব্যবহার করে প্রমাণীকরণ এবং লেনদেন সাইন করতে পারেন। আপনার সমস্ত কীগুলি এনক্রিপ্ট করা রাখা হয়।`,
              id: `Anda dapat menggunakan WebAuthn untuk mengotentikasi dan menandatangani transaksi. Semua kunci Anda disimpan terenkripsi.`,
              ur: `آپ ویب اتھن کا استعمال کرکے تصدیق اور ٹرانزیکشن کی تشہیر کرسکتے ہیں۔ تمام آپ کی چابیاں محفوظ ہیں۔`,
              ms: `Anda boleh menggunakan WebAuthn untuk mengesahkan dan menandatangani urus niaga. Semua kunci anda disimpan dienkripsi.`,
              it: `Puoi utilizzare WebAuthn per autenticarti e firmare transazioni. Tutte le tue chiavi sono memorizzate criptate.`,
              tr: `Kimlik doğrulama ve işlemleri imzalamak için WebAuthn'yi kullanabilirsiniz. Tüm anahtarlarınız şifrelenmiş olarak saklanır.`,
              ta: `உங்கள் ஐபி முகவரியை மூன்றாம் தரவுகளிலிருந்து மறைக்க வெப்ஆத்னை பயன்படுத்தலாம். அனைத்து கிளைகளும் என்கிரிப்டு செய்யப்பட்டுள்ளன.`,
              te: `మీ ఐపీ చిరునామాను మూడవ పార్టీల నుండి దాచేయడానికి వెబ్ఆత్న్ ఉపయోగించవచ్చు. మీరు ఉండిన అన్ని కీలు ఎన్క్రిప్ట్ చేయబడినవి.`,
              ko: `WebAuthn을 사용하여 인증하고 거래에 서명할 수 있습니다. 모든 키는 암호화되어 저장됩니다.`,
              vi: `Bạn có thể sử dụng WebAuthn để xác thực và ký giao dịch. Tất cả các khóa của bạn được lưu trữ dưới dạng mã hóa.`,
              pl: `Możesz użyć WebAuthn do uwierzytelniania i podpisywania transakcji. Wszystkie klucze są przechowywane w formie zaszyfrowanej.`,
              ro: `Puteți folosi WebAuthn pentru autentificare și semnarea tranzacțiilor. Toate cheile dvs. sunt stocate criptate.`,
              nl: `U kunt WebAuthn gebruiken om te authenticeren en transacties te ondertekenen. Al uw sleutels worden versleuteld opgeslagen.`,
              el: `Μπορείτε να χρησιμοποιήσετε το WebAuthn για πιστοποίηση και υπογραφή συναλλαγών. Όλα τα κλειδιά σας αποθηκεύονται κρυπτογραφημένα.`,
              th: `คุณสามารถใช้ WebAuthn เพื่อรับรองตัวและลงชื่อในธุรกรรม ทุกกุญแจของคุณถูกเก็บเข้ารหัส`,
              cs: `Můžete použít WebAuthn k ověření a podepsání transakcí. Všechny vaše klíče jsou uloženy zašifrované.`,
              hu: `WebAuthn-t használhat az azonosításhoz és a tranzakciók aláírásához. Az összes kulcs titkosítva van tárolva.`,
              sv: `Du kan använda WebAuthn för att autentisera och signera transaktioner. Alla dina nycklar lagras krypterade.`,
              da: `Du kan bruge WebAuthn til at autentificere og signere transaktioner. Alle dine nøgler er gemt krypteret.`,
            }, locale)}>
            <LocalizedFour />
          </InfoCard>
          <InfoCard
            title="Truth"
            href="/5"
            subtitle={Locale.get({
              en: `Each request is sent to multiple servers to ensure no one lies about the blockchain state.`,
              zh: `每个请求都发送到多个服务器，以确保没有人对区块链状态撒谎。`,
              hi: `प्रत्येक अनुरोध को ब्लॉकचेन स्थिति के बारे में कोई झूठ न बोले इस सुनिश्चित करने के लिए कई सर्वरों को भेजा जाता है।`,
              es: `Cada solicitud se envía a varios servidores para asegurarse de que nadie mienta sobre el estado de la cadena de bloques.`,
              ar: `يتم إرسال كل طلب إلى عدة خوادم لضمان عدم كذب أحد حول حالة سلسلة الكتل.`,
              fr: `Chaque demande est envoyée à plusieurs serveurs pour s'assurer que personne ne ment sur l'état de la blockchain.`,
              de: `Jede Anfrage wird an mehrere Server gesendet, um sicherzustellen, dass niemand über den Zustand der Blockchain lügt.`,
              ru: `Каждый запрос отправляется на несколько серверов, чтобы никто не лгал о состоянии блокчейна.`,
              pt: `Cada solicitação é enviada para vários servidores para garantir que ninguém minta sobre o estado da blockchain.`,
              ja: `各リクエストは、誰もがブロックチェーンの状態について嘘をつかないように、複数のサーバーに送信されます。`,
              pa: `ਹਰ ਬਿੰਦੂ ਨੂੰ ਬਲਾਕਚੇਨ ਦੀ ਹਾਲਤ ਬਾਰੇ ਕੋਈ ਝੂਠ ਨਾ ਬੋਲੇ ਇਸ ਨੂੰ ਯਕੀਨੀ ਬਣਾਉਣ ਲਈ ਹਰ ਬਿੰਦੂ ਨੂੰ ਕਈ ਸਰਵਰਾਂ ਨੂੰ ਭੇਜਿਆ ਜਾਂਦਾ ਹੈ।`,
              bn: `প্রতিটি অনুরোধ ব্লকচেন অবস্থানের বিষয়ে কেউ মিথ্যা বলেনা তা নিশ্চিত করার জন্য এটি একাধিক সার্ভারে পাঠানো হয়।`,
              id: `Setiap permintaan dikirim ke beberapa server untuk memastikan tidak ada yang berbohong tentang status blockchain.`,
              ur: `ہر درخواست کو بلاک چین حالت کے بارے میں کوئی جھوٹ نہیں بولتا یہ یقینی بنانے کے لئے کئی سروروں کو بھیجا جاتا ہے۔`,
              ms: `Setiap permintaan dihantar ke pelbagai pelayan untuk memastikan tiada sesiapa yang berbohong tentang keadaan rangkaian blockchain.`,
              it: `Ogni richiesta viene inviata a più server per garantire che nessuno menta sullo stato della blockchain.`,
              tr: `Her istek, blok zincir durumu hakkında kimse yalan söylemediğinden emin olmak için birden çok sunucuya gönderilir.`,
              ta: `ஒவ்வொரு கோரிக்கையும் பிளாக்சைன் நிலையை பற்றி ஒருவரும் பொய் சொல்லவில்லை என்பதை உறுதிப்படுத்த பல சேவைகளுக்கு அனுப்பப்படுகின்றது.`,
              te: `ప్రతి అభ్యర్థన బ్లాక్చైన్ స్థితి గురించి ఎవరూ అసత్యం చెబుతున్నట్లు ఖచ్చితం చేస్తుంది.`,
              ko: `각 요청은 블록체인 상태에 대해 누구도 거짓말하지 않도록 여러 서버로 전송됩니다.`,
              vi: `Mỗi yêu cầu được gửi đến nhiều máy chủ để đảm bảo không ai nói dối về trạng thái blockchain.`,
              pl: `Każde żądanie jest wysyłane do wielu serwerów, aby zapewnić, że nikt nie kłamie na temat stanu blockchain.`,
              ro: `Fiecare cerere este trimisă la mai multe servere pentru a asigura că nimeni nu minte despre starea blockchain.`,
              nl: `Elk verzoek wordt naar meerdere servers gestuurd om ervoor te zorgen dat niemand liegt over de status van de blockchain.`,
              el: `Κάθε αίτημα στέλνεται σε πολλούς διακομιστές για να διασφαλιστεί ότι κανείς δεν λέει ψέματα για την κατάσταση της blockchain.`,
              th: `แต่ละคำขอถูกส่งไปยังเซิร์ฟเวอร์หลายเครื่องเพื่อให้แน่ใจว่าไม่มีใครโกหกเกี่ยวกับสถานะบล็อกเชน`,
              cs: `Každý požadavek je odeslán na několik serverů, aby se zajistilo, že nikdo nelže o stavu blockchainu.`,
              hu: `Minden kérés több szerverre van küldve annak érdekében, hogy senki se hazudjon a blokklánc állapotáról.`,
              sv: `Varje begäran skickas till flera servrar för att säkerställa att ingen ljuger om blockkedjans tillstånd.`,
              da: `Hver anmodning sendes til flere servere for at sikre, at ingen lyver om blockchain-tilstanden.`,
            }, locale)}>
            <LocalizedFive />
          </InfoCard>
          <InfoCard
            title="MIT"
            href="/6"
            subtitle={Locale.get({
              en: `All our code is MIT-licensed reproducible open-source. You can build it yourself.`,
              zh: `我们的所有代码都是 MIT 许可的可重现开源。您可以自己构建它。`,
              hi: `हमारा सभी कोड MIT-लाइसेंस नकली ओपन-सोर्स है। आप इसे खुद बना सकते हैं।`,
              es: `Todo nuestro código es de código abierto reproducible con licencia MIT. Puedes construirlo tú mismo.`,
              ar: `جميع رموزنا مرخصة بـ MIT ومفتوحة المصدر يمكن إعادة إنتاجها. يمكنك بناؤه بنفسك.`,
              fr: `Tout notre code est open source reproductible sous licence MIT. Vous pouvez le construire vous-même.`,
              de: `Unser gesamter Code ist MIT-lizenziert und reproduzierbarer Open Source. Sie können es selbst erstellen.`,
              ru: `Весь наш код лицензирован MIT, воспроизводимый с открытым исходным кодом. Вы можете построить его самостоятельно.`,
              pt: `Todo o nosso código é de código aberto reproduzível com licença MIT. Você pode construí-lo você mesmo.`,
              ja: `すべてのコードは MIT ライセンスの再現可能なオープンソースです。自分でビルドできます。`,
              pa: `ਸਾਰਾ ਸਾਡਾ ਕੋਡ MIT-ਲਾਇਸੈਂਸਡ ਪੁਨਰਾਵਰਤਨੀਯ ਓਪਨ-ਸੋਰਸ ਹੈ। ਤੁਸੀਂ ਇਸਨੂੰ ਆਪਣੇ ਆਪ ਬਣਾ ਸਕਦੇ ਹੋ।`,
              bn: `আমাদের সমস্ত কোড MIT-লাইসেন্সযুক্ত পুনরাবৃত্তিযোগ্য ওপেন-সোর্স। আপনি এটি নিজে তৈরি করতে পারেন।`,
              id: `Semua kode kami adalah open source yang dapat direproduksi dengan lisensi MIT. Anda dapat membangunnya sendiri.`,
              ur: `ہمارا تمام کوڈ MIT-لائسنس کی نقلی اوپن سورس ہے۔ آپ اسے خود بنا سکتے ہیں۔`,
              ms: `Semua kod kami adalah sumber terbuka boleh diterbitkan semula dengan lesen MIT. Anda boleh membina sendiri.`,
              it: `Tutto il nostro codice è open source riproducibile con licenza MIT. Puoi costruirlo tu stesso.`,
              tr: `Tüm kodumuz MIT lisanslı çoğaltılabilir açık kaynaktır. Kendiniz oluşturabilirsiniz.`,
              ta: `எங்கள் அனைத்து குறியீடுகளும் MIT-லைசன்ஸ் பொருளாதாரமான திறந்த மூலக்கூறுகளாகும். நீங்களே அதை உருவாக்கலாம்.`,
              te: `మా అన్ని కోడ్ లు MIT-లైసెన్స్ తో పునరుత్పాదన యోగ్యమైన ఓపెన్-సోర్స్. మీరు అది స్వయం నిర్మించవచ్చు.`,
              ko: `우리 모든 코드는 MIT 라이선스가 부여된 재현 가능한 오픈 소스입니다. 직접 빌드할 수 있습니다.`,
              vi: `Tất cả mã nguồn của chúng tôi đều được cấp phép MIT có thể tái tạo. Bạn có thể xây dựng nó.`,
              pl: `Cały nasz kod jest otwartym źródłem, który można odtworzyć z licencją MIT. Możesz go zbudować samodzielnie.`,
              ro: `Tot codul nostru este open source reproductibil cu licență MIT. Puteți construi singuri.`,
              nl: `Al onze code is MIT-licentie reproduceerbare open source. U kunt het zelf bouwen.`,
              el: `Ολόκληρος ο κώδικάς μας είναι αναπαράσταση ανοικτού κώδικα με άδεια MIT. Μπορείτε να το χτίσετε μόνοι σας.`,
              th: `โค้ดของเราทั้งหมดเป็นโอเพนซอร์สที่สามารถทำซ้ำได้ด้วย MIT-licensed คุณสามารถสร้างมันเอง`,
              cs: `Veškerý náš kód je MIT-licencován reprodukovatelný open source. Můžete si jej postavit sami.`,
              hu: `Az összes kódunk MIT-licencű reprodukálható nyílt forráskódú. Maga is felépítheti.`,
              sv: `All vår kod är MIT-licensierad reproducerbar öppen källkod. Du kan bygga det själv.`,
              da: `Alt vores kode er MIT-licenseret reproducerbar open source. Du kan bygge det selv.`,
            }, locale)}>
            <LocalizedSix />
          </InfoCard>
        </div>
        <div className="h-16" />
        <div className="text-center text-2xl font-medium"
          id={hash.go("/download").hash.slice(1)}>
          {Locale.get(Locale.Download, locale)}
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
          <InstallCard
            highlighted={navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome") && !navigator.userAgent.includes("Android")}
            icon={Outline.PlusIcon}
            title="Safari"
            src="/assets/browsers/safari.svg"
            href="/install/iphone">
            iPhone, iPad, Mac
          </InstallCard>
          <InstallCard
            highlighted={navigator.userAgent.includes("Android")}
            icon={Outline.PlusIcon}
            title="Android"
            src="/assets/browsers/android.svg"
            href="/install/android">
            Google, Samsung, Huawei, Xiaomi, Oppo, Vivo
          </InstallCard>
        </div>
        <div className="h-4" />
        <WideClickableContrastAnchor
          target="_blank" rel="noreferrer"
          href="https://github.com/brumewallet/wallet#usage">
          <Outline.ArrowTopRightOnSquareIcon className="size-5" />
          {Locale.get(Locale.MoreDownloads, locale)}
        </WideClickableContrastAnchor>
        <div className="h-[50vh]" />
        <div className="p-4 flex items-center justify-center gap-2">
          <TextAnchor
            target="_blank" rel="noreferrer"
            href="https://brume.money">
            {Locale.get(Locale.MadeByCypherpunks, locale)}
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
    <GlobalBottomNavigation />
  </>
}

export function UsersMenu() {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()

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
      <div className="rounded-full size-7 flex justify-center items-center border border-default-contrast border-dashed">
        <Outline.PlusIcon className="size-4" />
      </div>
      {Locale.get(Locale.NewUser, locale)}
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
  const locale = useLocaleContext().getOrThrow()
  const { children, title, subtitle, href, ...rest } = props

  const hash = useHashSubpath(path)
  const coords = useCoords(hash, href)

  return <>
    <HashSubpathProvider>
      {hash.url.pathname === href &&
        <Dialog hesitant>
          <div className="text-6xl rtl:text-right"
            dir="ltr">
            {title}
          </div>
          <div className="h-2" />
          <div className="text-default-contrast">
            {subtitle}
          </div>
          <div className="h-8" />
          <div className="[&_p]:text-default-contrast [&_h2]:font-medium">
            {children}
          </div>
        </Dialog>}
    </HashSubpathProvider>
    <div className="p-6 aspect-square bg-default-contrast rounded-xl flex flex-col">
      <div className="text-6xl rtl:text-right"
        dir="ltr">
        {title}
      </div>
      <div className="h-4 grow" />
      <div className="">
        <span className="text-default-contrast">
          {subtitle}
        </span>
        <span>{` `}</span>
        <TextAnchor
          onClick={coords.onClick}
          onKeyDown={coords.onKeyDown}
          href={coords.href}
          {...rest}>
          {Locale.get({
            en: "Learn more.",
            zh: "了解更多。",
            hi: "और जानें।",
            es: "Aprende más.",
            ar: "تعلم المزيد.",
            fr: "En savoir plus.",
            de: "Erfahren Sie mehr.",
            ru: "Узнать больше.",
            pt: "Saber mais.",
            ja: "詳細を知る。",
            pa: "ਹੋਰ ਜਾਣੋ।",
            bn: "আরও জানুন।",
            id: "Pelajari lebih lanjut.",
            ur: "مزید جانیں۔",
            ms: "Ketahui lebih lanjut.",
            it: "Per saperne di più.",
            tr: "Daha fazla bilgi edinin.",
            ta: "மேலும் அறிக்க.",
            te: "మరింత అడగండి.",
            ko: "자세히 알아보기.",
            vi: "Tìm hiểu thêm.",
            pl: "Dowiedz się więcej.",
            ro: "Aflați mai multe.",
            nl: "Lees meer.",
            el: "Μάθετε περισσότερα.",
            th: "เรียนรู้เพิ่มเติม.",
            cs: "Dozvědět se více.",
            hu: "Tudj meg többet.",
            sv: "Lär dig mer.",
            da: "Lær mere.",
          }, locale)}
        </TextAnchor>
      </div>
    </div>
  </>
}

export function DownloadCard(props: TitleProps & ChildrenProps & { src: string } & { highlighted?: boolean } & { icon: any } & { href: string }) {
  const locale = useLocaleContext().getOrThrow()
  const { href, src, children, title, highlighted = false, icon: Icon } = props

  const onClick = useCallback(() => {
    window.open(href, "_blank", "noreferrer")
  }, [href])

  return <div className="p-6 bg-default-contrast rounded-xl flex flex-col data-[highlighted=false]:opacity-50 transition-opacity"
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
        <div className="text-default-contrast">
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
        {Locale.get(Locale.Download, locale)}
      </WideClickableContrastAnchor>
    </div>
  </div>
}

export function InstallCard(props: TitleProps & ChildrenProps & { src: string } & { highlighted?: boolean } & { icon: any } & { href: string }) {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()
  const { href, src, children, title, highlighted = false, icon: Icon } = props

  const hash = useHashSubpath(path)
  const coords = useCoords(hash, href)

  return <div className="p-6 bg-default-contrast rounded-xl flex flex-col data-[highlighted=false]:opacity-50 transition-opacity"
    data-highlighted={highlighted}
    onClick={coords.onClick}
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
        <div className="text-default-contrast">
          {children}
        </div>
      </div>
    </div>
    <div className="h-4 grow" />
    <div className="flex items-center">
      <WideClickableContrastAnchor
        onKeyDown={coords.onKeyDown}
        onClick={Events.keep}
        href={coords.href}>
        <Icon className="size-5" />
        {Locale.get(Locale.Install, locale)}
      </WideClickableContrastAnchor>
    </div>
  </div>
}

export function IphoneInstallDialog() {
  const locale = useLocaleContext().getOrThrow()

  return <>
    <Dialog.Title>
      {Locale.get({
        en: "Installing on Safari",
        zh: "在 Safari 上安装",
        hi: "Safari पर स्थापित करना",
        es: "Instalación en Safari",
        ar: "التثبيت على Safari",
        fr: "Installation sur Safari",
        de: "Installation auf Safari",
        ru: "Установка на Safari",
        pt: "Instalando no Safari",
        ja: "Safari にインストール",
        pa: "Safari 'ਤੇ ਇੰਸਟਾਲ ਕਰੋ",
        bn: "Safari এ ইনস্টল করুন",
        id: "Instalasi di Safari",
        ur: "سفاری پر انسٹال کریں",
        ms: "Pasang di Safari",
        it: "Installazione su Safari",
        tr: "Safari'de Yükleme",
        ta: "சபாரி இல் நிறுவுவது",
        te: "సఫారిలో ఇన్‌స్టాల్ చేయండి",
        ko: "Safari에 설치",
        vi: "Cài đặt trên Safari",
        pl: "Instalacja na Safari",
        ro: "Instalare pe Safari",
        nl: "Installeren op Safari",
        el: "Εγκατάσταση σε Safari",
        th: "ติดตั้งบน Safari",
        cs: "Instalace na Safari",
        hu: "Telepítés Safari-ban",
        sv: "Installation på Safari",
        da: "Installation på Safari",
      }, locale)}
    </Dialog.Title>
    <div className="h-4" />
    <div className="text-default-contrast">
      {Locale.get({
        en: `You can follow these steps to install Brume Wallet on your iPhone, iPad, or Mac. Use the share button and select "Add to Home Screen" on iPhone and iPad, or "Add to Dock" on Mac. Confirm the installation by clicking "Add".`,
        zh: `您可以按照以下步骤在 iPhone、iPad 或 Mac 上安装 Brume Wallet。使用共享按钮，在 iPhone 和 iPad 上选择“添加到主屏幕”，在 Mac 上选择“添加到 Dock”。点击“添加”确认安装。`,
        hi: `आप अपने iPhone, iPad या Mac पर Brume वॉलेट को स्थापित करने के लिए इन चरणों का पालन कर सकते हैं। शेयर बटन का उपयोग करें, और iPhone और iPad पर "होम स्क्रीन में जोड़ें" चुनें, या Mac पर "डॉक में जिला" चुनें। "जोड़ें" पर क्लिक करके स्थापना की पुष्टि करें।`,
        es: `Puede seguir estos pasos para instalar Brume Wallet en su iPhone, iPad o Mac. Utilice el botón de compartir y seleccione "Agregar a la pantalla de inicio" en iPhone y iPad, o "Agregar al Dock" en Mac. Confirme la instalación haciendo clic en "Agregar".`,
        ar: `يمكنك اتباع هذه الخطوات لتثبيت محفظة Brume على iPhone أو iPad أو Mac الخاص بك. استخدم زر المشاركة وحدد "إضافة إلى الشاشة الرئيسية" على iPhone و iPad، أو "إضافة إلى Dock" على Mac. قم بتأكيد التثبيت بالنقر فوق "إضافة".`,
        fr: `Vous pouvez suivre ces étapes pour installer Brume Wallet sur votre iPhone, iPad ou Mac. Utilisez le bouton de partage et sélectionnez "Ajouter à l'écran d'accueil" sur iPhone et iPad, ou "Ajouter au Dock" sur Mac. Confirmez l'installation en cliquant sur "Ajouter".`,
        de: `Sie können diesen Schritten folgen, um Brume Wallet auf Ihrem iPhone, iPad oder Mac zu installieren. Verwenden Sie die Schaltfläche "Teilen" und wählen Sie "Zum Startbildschirm hinzufügen" auf iPhone und iPad oder "Zum Dock hinzufügen" auf Mac. Bestätigen Sie die Installation durch Klicken auf "Hinzufügen".`,
        ru: `Вы можете следовать этим шагам, чтобы установить Brume Wallet на свой iPhone, iPad или Mac. Используйте кнопку "Поделиться" и выберите "Добавить на домашний экран" на iPhone и iPad или "Добавить в док" на Mac. Подтвердите установку, нажав "Добавить".`,
        pt: `Você pode seguir estas etapas para instalar o Brume Wallet no seu iPhone, iPad ou Mac. Use o botão de compartilhamento e selecione "Adicionar à tela inicial" no iPhone e iPad, ou "Adicionar ao Dock" no Mac. Confirme a instalação clicando em "Adicionar".`,
        ja: `iPhone、iPad、または Mac に Brume Wallet をインストールする手順に従うことができます。共有ボタンを使用し、iPhone と iPad では「ホーム画面に追加」、Mac では「Dock に追加」を選択します。クリックして「追加」をクリックしてインストールを確認します。`,
        pa: `ਆਪਣੇ iPhone, iPad ਜਾਂ Mac 'ਤੇ Brume ਵਾਲੇਟ ਨੂੰ ਸਥਾਪਿਤ ਕਰਨ ਲਈ ਇਹ ਕਦਮ ਕਰ ਸਕਦੇ ਹੋ। ਸਾਂਝਾ ਬਟਨ ਦੀ ਵਰਤੋਂ ਕਰੋ ਅਤੇ iPhone ਅਤੇ iPad 'ਤੇ "ਹੋਮ ਸਕ੍ਰੀਨ 'ਚ ਸ਼ਾਮਲ ਕਰੋ" ਚੁਣੋ, ਜਾਂ Mac 'ਤੇ "ਡਾਕ 'ਚ ਸ਼ਾਮਲ ਕਰੋ" ਚੁਣੋ। "ਸ਼ਾਮਲ ਕਰੋ" ਤੇ ਕਲਿੱਕ ਕਰਕੇ ਸਥਾਪਨਾ ਨੂੰ ਪੁਸ਼ਟੀ ਕਰੋ।`,
        bn: `আপনি আপনার iPhone, iPad বা Mac এ Brume ওয়ালেট ইনস্টল করতে এই ধাপগুলি অনুসরণ করতে পারেন। শেয়ার বাটন ব্যবহার করুন এবং iPhone এবং iPad এ "হোম স্ক্রিনে যোগ করুন" বা Mac এ "ডকে যোগ করুন" নির্বাচন করুন। "যোগ করুন" ক্লিক করে ইনস্টলেশন নিশ্চিত করুন।`,
        id: `Anda dapat mengikuti langkah-langkah ini untuk menginstal Brume Wallet di iPhone, iPad, atau Mac Anda. Gunakan tombol bagikan dan pilih "Tambahkan ke Layar Beranda" di iPhone dan iPad, atau "Tambahkan ke Dock" di Mac. Konfirmasi instalasi dengan mengklik "Tambahkan".`,
        ur: `آپ اپنے iPhone، iPad یا Mac پر Brume Wallet کو انسٹال کرنے کے لیے یہ مراحل مکمل کر سکتے ہیں۔ شیئر بٹن استعمال کریں اور iPhone اور iPad پر "ہوم اسکرین میں شامل کریں" یا Mac پر "ڈاک میں شامل کریں" منتخب کریں۔ "شامل کریں" پر کلک کر کے انسٹالیشن کی تصدیق کریں۔`,
        ms: `Anda boleh mengikuti langkah-langkah ini untuk memasang Brume Wallet di iPhone, iPad, atau Mac anda. Gunakan butang kongsi dan pilih "Tambah ke Skrin Utama" di iPhone dan iPad, atau "Tambah ke Dock" di Mac. Sahkan pemasangan dengan mengklik "Tambah".`,
        it: `Puoi seguire questi passaggi per installare Brume Wallet sul tuo iPhone, iPad o Mac. Utilizza il pulsante di condivisione e seleziona "Aggiungi a schermata iniziale" su iPhone e iPad, o "Aggiungi a Dock" su Mac. Conferma l'installazione facendo clic su "Aggiungi".`,
        tr: `iPhone, iPad veya Mac'inize Brume Wallet'i yüklemek için bu adımları izleyebilirsiniz. Paylaş düğmesini kullanın ve iPhone ve iPad'de "Ana Ekrana Ekle" veya Mac'te "Dock'a Ekle" seçeneğini belirleyin. "Ekle" yi tıklayarak kurulumu onaylayın.`,
        ta: `உங்கள் iPhone, iPad அல்லது Mac இல் Brume வாலெட்டை நிறுவ இந்த படிகளை பின்பற்றலாம். பகிர்வு பொத்தானை பயன்படுத்தி iPhone மற்றும் iPad வில் "முதல் தளத்தில் சேர்க்க" அல்லது Mac வில் "டாக்கில் சேர்க்க" ஐத் தேர்ந்தெடுக்கவும். "சேர்க்க" ஐ கிளிக் செய்து நிறுவலை உறுதிசெய்க.`,
        te: `మీ iPhone, iPad లేదా Mac లో Brume వాలెట్‌ను ఇన్‌స్టాల్ చేయడానికి ఈ చరిత్రలను అనుసరించవచ్చు. షేర్ బటన్‌ను ఉపయోగించి iPhone మరియు iPad లో "హోమ్ స్క్రీన్‌కు జోడించు" లేదా Mac లో "డాక్‌కు జోడించు" ఎంచుకోండి. "జోడించు" నొక్కి ఇన్‌స్టాలేషన్‌ను నిర్ధారించండి.`,
        ko: `iPhone, iPad 또는 Mac에 Brume Wallet을 설치하려면 이 단계를 따를 수 있습니다. 공유 버튼을 사용하고 iPhone 및 iPad에서 "홈 화면에 추가" 또는 Mac에서 "도크에 추가"를 선택하십시오. "추가"를 클릭하여 설치를 확인하십시오.`,
        vi: `Bạn có thể làm theo các bước này để cài đặt Brume Wallet trên iPhone, iPad hoặc Mac của bạn. Sử dụng nút chia sẻ và chọn "Thêm vào Màn hình chính" trên iPhone và iPad hoặc "Thêm vào Dock" trên Mac. Xác nhận cài đặt bằng cách nhấp vào "Thêm".`,
        pl: `Możesz postępować zgodnie z tymi krokami, aby zainstalować portfel Brume na swoim iPhone'u, iPadzie lub Macu. Użyj przycisku udostępniania i wybierz "Dodaj do ekranu głównego" na iPhone'ie i iPadzie lub "Dodaj do Dock" na Macu. Potwierdź instalację, klikając "Dodaj".`,
        ro: `Puteți urma acești pași pentru a instala portofelul Brume pe iPhone, iPad sau Mac. Utilizați butonul de partajare și selectați "Adăugare la ecranul de start" pe iPhone și iPad sau "Adăugare la Dock" pe Mac. Confirmați instalarea făcând clic pe "Adăugare".`,
        nl: `U kunt deze stappen volgen om Brume Wallet te installeren op uw iPhone, iPad of Mac. Gebruik de deelknop en selecteer "Toevoegen aan startscherm" op iPhone en iPad, of "Toevoegen aan Dock" op Mac. Bevestig de installatie door op "Toevoegen" te klikken.`,
        el: `Μπορείτε να ακολουθήσετε αυτά τα βήματα για να εγκαταστήσετε το Brume Wallet στο iPhone, iPad ή Mac σας. Χρησιμοποιήστε το κουμπί κοινοποίησης και επιλέξτε "Προσθήκη στην αρχική οθόνη" στο iPhone και iPad ή "Προσθήκη στο Dock" στο Mac. Επιβεβαιώστε την εγκατάσταση κάνοντας κλικ στο "Προσθήκη".`,
        th: `คุณสามารถทำตามขั้นตอนเหล่านี้เพื่อติดตั้งบรัมวอลเล็ตบน iPhone, iPad หรือ Mac ของคุณ ใช้ปุ่มแชร์และเลือก "เพิ่มไปยังหน้าจอหลัก" บน iPhone และ iPad หรือ "เพิ่มไปยังด็อก" บน Mac ยืนยันการติดตั้งโดยคลิกที่ "เพิ่ม"`,
        cs: `Můžete postupovat podle těchto kroků pro instalaci Brume Wallet na svém iPhone, iPadu nebo Macu. Použijte tlačítko sdílení a vyberte "Přidat na domovskou obrazovku" na iPhonu a iPadu nebo "Přidat do dokovací stanice" na Macu. Potvrďte instalaci kliknutím na "Přidat".`,
        hu: `Ezeket a lépéseket követve telepítheti a Brume Wallet-et iPhone-jára, iPadjére vagy Mac gépére. Használja a megosztás gombot, és válassza ki az "Hozzáadás a kezdőképernyőhöz" lehetőséget iPhone-on és iPad-en, vagy az "Hozzáadás a dokkhoz" lehetőséget Mac-en. A telepítés megerősítéséhez kattintson az "Hozzáadás" gombra.`,
        sv: `Du kan följa dessa steg för att installera Brume Wallet på din iPhone, iPad eller Mac. Använd dela-knappen och välj "Lägg till på startsidan" på iPhone och iPad eller "Lägg till i Dock" på Mac. Bekräfta installationen genom att klicka på "Lägg till".`,
        da: `Du kan følge disse trin for at installere Brume Wallet på din iPhone, iPad eller Mac. Brug del-knappen og vælg "Føj til startskærm" på iPhone og iPad eller "Føj til Dock" på Mac. Bekræft installationen ved at klikke på "Tilføj".`,
      }, locale)}
    </div>
    <div className="h-8" />
    <div className="flex flex-wrap items-center justify-center gap-2">
      <img className="w-auto h-[480px] rounded-[32px] border-8 border-default-contrast"
        src="/assets/install/iphone-1.png" />
      <img className="w-auto h-[480px] rounded-[32px] border-8 border-default-contrast"
        src="/assets/install/iphone-2.png" />
      <img className="w-auto h-[480px] rounded-[32px] border-8 border-default-contrast"
        src="/assets/install/iphone-3.png" />
    </div>
  </>
}

export function AndroidInstallDialog() {
  const locale = useLocaleContext().getOrThrow()

  return <>
    <Dialog.Title>
      {Locale.get({
        en: "Installing on Android",
        zh: "在 Android 上安装",
        hi: "एंड्रॉयड पर स्थापित करना",
        es: "Instalación en Android",
        ar: "التثبيت على Android",
        fr: "Installation sur Android",
        de: "Installation auf Android",
        ru: "Установка на Android",
        pt: "Instalando no Android",
        ja: "Android にインストール",
        pa: "Android 'ਤੇ ਇੰਸਟਾਲ ਕਰੋ",
        bn: "অ্যান্ড্রয়েডে ইনস্টল করুন",
        id: "Instalasi di Android",
        ur: "انڈرائیڈ پر انسٹال کریں",
        ms: "Pasang di Android",
        it: "Installazione su Android",
        tr: "Android'de Yükleme",
        ta: "ஆண்ட்ராய்டில் நிறுவுவது",
        te: "ఆండ్రాయిడ్‌లో ఇన్‌స్టాల్ చేయండి",
        ko: "Android에 설치",
        vi: "Cài đặt trên Android",
        pl: "Instalacja na Androidzie",
        ro: "Instalare pe Android",
        nl: "Installeren op Android",
        el: "Εγκατάσταση σε Android",
        th: "ติดตั้งบน Android",
        cs: "Instalace na Androidu",
        hu: "Telepítés Androidon",
        sv: "Installation på Android",
        da: "Installation på Android",
      }, locale)}
    </Dialog.Title>
    <div className="h-4" />
    <div className="text-default-contrast">
      {Locale.get({
        en: `You can follow these steps to install Brume Wallet on your Android. Open the browser menu and select "Add to Home screen". Confirm the installation by clicking "Install".`,
        zh: `您可以按照以下步骤在 Android 上安装 Brume Wallet。打开浏览器菜单，然后选择“添加到主屏幕”。点击“安装”确认安装。`,
        hi: `आप अपने Android पर Brume वॉलेट को स्थापित करने के लिए इन चरणों का पालन कर सकते हैं। ब्राउज़र मेनू खोलें और "होम स्क्रीन में जोड़ें" का चयन करें। "स्थापित" पर क्लिक करके स्थापना की पुष्टि करें।`,
        es: `Puede seguir estos pasos para instalar Brume Wallet en su Android. Abra el menú del navegador y seleccione "Agregar a la pantalla de inicio". Confirme la instalación haciendo clic en "Instalar".`,
        ar: `يمكنك اتباع هذه الخطوات لتثبيت محفظة Brume على جهاز Android الخاص بك. افتح قائمة المتصفح وحدد "إضافة إلى الشاشة الرئيسية". أكد التثبيت بالنقر فوق "تثبيت".`,
        fr: `Vous pouvez suivre ces étapes pour installer Brume Wallet sur votre Android. Ouvrez le menu du navigateur et sélectionnez "Ajouter à l'écran d'accueil". Confirmez l'installation en cliquant sur "Installer".`,
        de: `Sie können diesen Schritten folgen, um Brume Wallet auf Ihrem Android zu installieren. Öffnen Sie das Browsermenü und wählen Sie "Zum Startbildschirm hinzufügen". Bestätigen Sie die Installation, indem Sie auf "Installieren" klicken.`,
        ru: `Вы можете следовать этим шагам, чтобы установить Brume Wallet на своем Android. Откройте меню браузера и выберите "Добавить на домашний экран". Подтвердите установку, нажав "Установить".`,
        pt: `Você pode seguir estas etapas para instalar o Brume Wallet no seu Android. Abra o menu do navegador e selecione "Adicionar à tela inicial". Confirme a instalação clicando em "Instalar".`,
        ja: `Android に Brume Wallet をインストールするには、これらの手順に従うことができます。ブラウザメニューを開き、「ホーム画面に追加」を選択します。 "インストール"をクリックしてインストールを確認します。`,
        pa: `ਤੁਸੀਂ ਆਪਣੇ Android ਉੱਤੇ Brume ਵਾਲੇਟ ਨੂੰ ਸਥਾਪਿਤ ਕਰਨ ਲਈ ਇਹ ਚੱਲਾਂ ਸਕਦੇ ਹੋ। ਬ੍ਰਾਉਜ਼ਰ ਮੀਨੂ ਖੋਲੋ ਅਤੇ "ਹੋਮ ਸਕ੍ਰੀਨ 'ਤੇ ਸ਼ਾਮਲ ਕਰੋ" ਚੁਣੋ। "ਸਥਾਪਿਤ" 'ਤੇ ਕਲਿੱਕ ਕਰਕੇ ਸਥਾਪਨਾ ਨੂੰ ਪੁਸ਼ਟੀ ਕਰੋ।`,
        bn: `আপনি আপনার Android উপর Brume ওয়ালেট ইনস্টল করতে এই ধাপগুলি অনুসরণ করতে পারেন। ব্রাউজার মেনু খুলুন এবং "হোম স্ক্রিনে যোগ করুন" নির্বাচন করুন। "ইনস্টল" ক্লিক করে ইনস্টলেশন নিশ্চিত করুন।`,
        id: `Anda dapat mengikuti langkah-langkah ini untuk menginstal Brume Wallet di Android Anda. Buka menu browser dan pilih "Tambahkan ke layar beranda". Konfirmasi instalasi dengan mengklik "Instal".`,
        ur: `آپ اپنے Android پر Brume Wallet کو انسٹال کرنے کے لئے ان مراحل کا پیروی کر سکتے ہیں۔ براؤزر مینو کھولیں اور "ہوم اسکرین میں شامل کریں" منتخب کریں۔ "انسٹال" پر کلک کرکے انسٹالیشن کی تصدیق کریں۔`,
        ms: `Anda boleh mengikuti langkah-langkah ini untuk memasang Brume Wallet di Android anda. Buka menu pelayar dan pilih "Tambah ke skrin utama". Sahkan pemasangan dengan mengklik "Pasang".`,
        it: `Puoi seguire questi passaggi per installare Brume Wallet sul tuo Android. Apri il menu del browser e seleziona "Aggiungi alla schermata iniziale". Conferma l'installazione facendo clic su "Installa".`,
        tr: `Android'de Brume Wallet'i yüklemek için bu adımları izleyebilirsiniz. Tarayıcı menüsünü açın ve "Ana ekrana ekle" yi seçin. "Yükle" yi tıklayarak kurulumu onaylayın.`,
        ta: `உங்கள் Android உலாவியில் Brume Wallet ஐ நிறுவ இந்த படிகளை பின்பற்றலாம். உலாவி பட்டியலை திறக்கவும் மற்றும் "முகப்பு தளத்தில் சேர்க்க" ஐ தேர்வு செய்க. "நிறுவு" ஐ கிளிக் செய்து நிறுவலை உறுதிசெய்க.`,
        te: `మీ Android లో Brume వాలెట్‌ను ఇన్‌స్టాల్ చేయడానికి ఈ చరిత్రలను అనుసరించవచ్చు. బ్రౌజర్ మెనూను తెరువండి "హోమ్ స్క్రీన్‌కు జోడించు" ఎంచుకోండి. "ఇన్‌స్టాల్" నొక్కడం ద్వారా ఇన్‌స్టాలేషన్‌ను నిర్ధారించండి.`,
        ko: `Android에 Brume Wallet을 설치하려면 이 단계를 따를 수 있습니다. 브라우저 메뉴를 열고 "홈 화면에 추가"를 선택하십시오. "설치"를 클릭하여 설치를 확인하십시오.`,
        vi: `Bạn có thể làm theo các bước này để cài đặt Brume Wallet trên Android của bạn. Mở menu trình duyệt và chọn "Thêm vào màn hình chính". Xác nhận cài đặt bằng cách nhấp vào "Cài đặt".`,
        pl: `Możesz postępować zgodnie z tymi krokami, aby zainstalować portfel Brume na swoim urządzeniu z systemem Android. Otwórz menu przeglądarki i wybierz "Dodaj do ekranu głównego". Potwierdź instalację, klikając "Zainstaluj".`,
        ro: `Puteți urma acești pași pentru a instala portofelul Brume pe Android. Deschideți meniul browserului și selectați "Adăugați la ecranul de start". Confirmați instalarea făcând clic pe "Instalare".`,
        nl: `U kunt deze stappen volgen om Brume Wallet op uw Android te installeren. Open het browsermenu en selecteer "Toevoegen aan startscherm". Bevestig de installatie door op "Installeren" te klikken.`,
        el: `Μπορείτε να ακολουθήσετε αυτά τα βήματα για να εγκαταστήσετε το πορτοφόλι Brume στο Android σας. Ανοίξτε το μενού του προγράμματος περιήγησης και επιλέξτε "Προσθήκη στην αρχική οθόνη". Επιβεβαιώστε την εγκατάσταση κάνοντας κλικ στο "Εγκατάσταση".`,
        th: `คุณสามารถทำตามขั้นตอนเหล่านี้เพื่อติดตั้งกระเป๋าเงิน Brume บนอุปกรณ์ Android ของคุณ ให้เปิดเมนูเบราว์เซอร์และเลือก "เพิ่มไปยังหน้าจอหลัก" ยืนยันการติดตั้งโดยคลิก "ติดตั้ง"`,
        cs: `Můžete postupovat podle těchto kroků pro instalaci peněženky Brume na svém zařízení Android. Otevřete nabídku prohlížeče a vyberte "Přidat na domovskou obrazovku". Potvrďte instalaci kliknutím na "Instalovat".`,
        hu: `Ezeket a lépéseket követve telepítheti a Brume Wallet-et az Android készülékére. Nyissa meg a böngésző menüjét, majd válassza a "Hozzáadás a kezdőképernyőhöz" lehetőséget. A telepítés megerősítéséhez kattintson az "Install" gombra.`,
        sv: `Du kan följa dessa steg för att installera Brume Wallet på din Android. Öppna webbläsarmenyn och välj "Lägg till på startskärmen". Bekräfta installationen genom att klicka på "Installera".`,
        da: `Du kan følge disse trin for at installere Brume Wallet på din Android. Åbn browsermenuen og vælg "Føj til startskærm". Bekræft installationen ved at klikke på "Installer".`,
      }, locale)}
    </div>
    <div className="h-8" />
    <div className="flex flex-wrap items-center justify-center gap-2">
      <img className="w-auto h-[480px] rounded-[32px] border-8 border-default-contrast"
        src="/assets/install/android-1.png" />
      <img className="w-auto h-[480px] rounded-[32px] border-8 border-default-contrast"
        src="/assets/install/android-2.png" />
      <img className="w-auto h-[480px] rounded-[32px] border-8 border-default-contrast"
        src="/assets/install/android-3.png" />
    </div>
  </>
}