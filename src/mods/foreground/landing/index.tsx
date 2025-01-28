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
import { Two } from "@/mods/foreground/landing/2";
import { Three } from "@/mods/foreground/landing/3";
import { Four } from "@/mods/foreground/landing/4";
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
import { One } from "./1";

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
          <h1 className="flex flex-col gap-2 text-center text-6xl font-medium"
            data-dir={Locale.get(Locale.direction, lang)}>
            <div>
              {Locale.get(Locale.Hello, lang)}
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

  const hash = useHashSubpath(path)
  const users = useCoords(hash, "/users")

  const LocalizedOne = Locale.get(One, lang)
  const LocalizedTwo = Locale.get(Two, lang)
  const LocalizedThree = Locale.get(Three, lang)
  const LocalizedFour = Locale.get(Four, lang)

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
      {hash.url.pathname === "/install/iphone" &&
        <Dialog>
          <IphoneInstallDialog />
        </Dialog>}
      {hash.url.pathname === "/install/android" &&
        <Dialog>
          <AndroidInstallDialog />
        </Dialog>}
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
          <div className="text-center text-default-contrast text-2xl">
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
              href={hash.go("/download").href}>
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
            } satisfies Localized<string>, lang)}>
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
            }, lang)}>
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
            }, lang)}>
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
            }, lang)}>
            <LocalizedFour />
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
          id={hash.go("/download").hash.slice(1)}>
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
          <InstallCard
            highlighted={navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome") && !navigator.userAgent.includes("Android")}
            icon={Outline.ArrowTopRightOnSquareIcon}
            title="Safari"
            src="/assets/browsers/safari.svg"
            href="/install/iphone">
            iOS, iPadOS, macOS
          </InstallCard>
          <InstallCard
            highlighted={navigator.userAgent.includes("Android")}
            icon={Outline.ArrowDownTrayIcon}
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
      <div className="rounded-full size-7 flex justify-center items-center border border-default-contrast border-dashed">
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
  const lang = useLocaleContext().getOrThrow()
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
          <div className="text-default-contrast">
            {subtitle}
          </div>
          <div className="h-8" />
          {children}
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
          onClick={genius.onClick}
          onKeyDown={genius.onKeyDown}
          href={genius.href}
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
          }, lang)}
        </TextAnchor>
      </div>
    </div>
  </>
}

export function DownloadCard(props: TitleProps & ChildrenProps & { src: string } & { highlighted?: boolean } & { icon: any } & { href: string }) {
  const lang = useLocaleContext().getOrThrow()
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
        {Locale.get(Locale.Download, lang)}
      </WideClickableContrastAnchor>
    </div>
  </div>
}

export function InstallCard(props: TitleProps & ChildrenProps & { src: string } & { highlighted?: boolean } & { icon: any } & { href: string }) {
  const lang = useLocaleContext().getOrThrow()
  const path = usePathContext().getOrThrow()
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
        {Locale.get(Locale.Install, lang)}
      </WideClickableContrastAnchor>
    </div>
  </div>
}

export function IphoneInstallDialog() {
  return <>
    <Dialog.Title>
      Installing on iPhone
    </Dialog.Title>
    <div className="h-4" />
    <div className="text-default-contrast">
      {`You can follow these steps to install Brume Wallet on your iPhone, iPad, or Mac. Use the share button and select "Add to Home Screen". Confirm the installation by clicking "Add".`}
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
  return <>
    <Dialog.Title>
      Installing on Android
    </Dialog.Title>
    <div className="h-4" />
    <div className="text-default-contrast">
      {`You can follow these steps to install Brume Wallet on your Android. Open the browser menu and select "Add to Home screen". Confirm the installation by clicking "Install".`}
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