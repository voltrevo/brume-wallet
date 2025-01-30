import { Errors } from "@/libs/errors/errors";
import { chainDataByChainId } from "@/libs/ethereum/mods/chain";
import { Objects } from "@/libs/objects/objects";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { ContrastSubtitleDiv } from "@/libs/ui/div";
import { ContrastLabel } from "@/libs/ui/label";
import { PageBody, PageHeader } from "@/libs/ui/page/header";
import { UserPage } from "@/libs/ui/page/page";
import { HashSelector } from "@/libs/ui/select";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { Data } from "@hazae41/glacier";
import { Option, Some } from "@hazae41/option";
import { useChain } from "../../../../../entities/settings/data";

export function UserSettingsPage() {
  const locale = useLocaleContext().getOrThrow()

  const chain = useChain()

  const setChainIdOrLogAndAlert = useAsyncUniqueCallback((value: string) => Errors.runOrLogAndAlert(async () => {
    await chain.mutateOrThrow(() => new Some(new Data(Number(value))))
  }), [])

  return <UserPage>
    <PageHeader title={Locale.get(Locale.Settings, locale)} />
    <PageBody>
      <ContrastSubtitleDiv>
        {Locale.get(Locale.Compatibility, locale)}
      </ContrastSubtitleDiv>
      <ContrastLabel>
        <div className="flex-none">
          {Locale.get({
            en: "Default chain",
            zh: "默认链",
            hi: "डिफ़ॉल्ट श्रृंखला",
            es: "Cadena predeterminada",
            ar: "السلسلة الافتراضية",
            fr: "Chaîne par défaut",
            de: "Standardkette",
            ru: "Цепь по умолчанию",
            pt: "Cadeia padrão",
            ja: "デフォルトチェーン",
            pa: "ਮੂਲ ਸਲਾਖ",
            bn: "ডিফল্ট চেইন",
            id: "Rantai default",
            ur: "ڈیفالٹ چین",
            ms: "Rantai lalai",
            it: "Catena predefinita",
            tr: "Varsayılan zincir",
            ta: "இயல்பு சங்கம்",
            te: "డిఫాల్ట్ చేన్",
            ko: "기본 체인",
            vi: "Chuỗi mặc định",
            pl: "Domyślny łańcuch",
            ro: "Lanț implicit",
            nl: "Standaardketen",
            el: "Προεπιλεγμένη αλυσίδα",
            th: "โซ่เริ่มต้น",
            cs: "Výchozí řetěz",
            hu: "Alapértelmezett lánc",
            sv: "Standardkedja",
            da: "Standardkæde"
          }, locale)}
        </div>
        <div className="w-4 grow" />
        <HashSelector
          pathname="/chain"
          value={String(Option.wrap(chain.real?.current.get()).getOr(1))}
          ok={setChainIdOrLogAndAlert.run}>
          {Objects.fromEntries(Objects.values(chainDataByChainId).map(x => [String(x.chainId), x.name]))}
        </HashSelector>
      </ContrastLabel>
      <div className="po-2 text-default-contrast">
        {Locale.get({
          en: "Use this parameter if some app requires a specific chain",
          zh: "如果某些应用程序需要特定链，请使用此参数",
          hi: "इस पैरामीटर का उपयोग करें यदि कोई ऐप विशेष श्रृंखला की आवश्यकता है",
          es: "Use este parámetro si alguna aplicación requiere una cadena específica",
          ar: "استخدم هذا المعلم إذا كانت بعض التطبيقات تتطلب سلسلة معينة",
          fr: "Utilisez ce paramètre si une application nécessite une chaîne spécifique",
          de: "Verwenden Sie diesen Parameter, wenn eine bestimmte Kette erforderlich ist",
          ru: "Используйте этот параметр, если какое-либо приложение требует определенной цепи",
          pt: "Use este parâmetro se algum aplicativo exigir uma cadeia específica",
          ja: "特定のチェーンが必要なアプリがある場合は、このパラメータを使用してください",
          pa: "ਇਸ ਪੈਰਾਮੀਟਰ ਦੀ ਵਰਤੋਂ ਕਰੋ ਜੇ ਕੋਈ ਐਪ ਖਾਸ ਸਲਾਖ ਦੀ ਲੋੜ ਹੈ",
          bn: "কিছু অ্যাপ্লিকেশন নির্দিষ্ট চেইন প্রয়োজন করলে এই প্যারামিটারটি ব্যবহার করুন",
          id: "Gunakan parameter ini jika beberapa aplikasi memerlukan rantai tertentu",
          ur: "اس پیرامیٹر کا استعمال کریں اگر کوئی ایپ کسی خاص چین کی ضرورت ہو",
          ms: "Gunakan parameter ini jika sesetengah aplikasi memerlukan rantai tertentu",
          it: "Usa questo parametro se un'app richiede una catena specifica",
          tr: "Belirli bir zincir gerektiren bir uygulama varsa bu parametreyi kullanın",
          ta: "சில பயன்பாடுகள் குறித்து சிறந்த சங்கம் தேவைப்படும் என்றால் இந்த அளவைப் பயன்படுத்தவும்",
          te: "కొన్ని అనువర్తనాలు ప్రత్యేక చేన్ అవసరం ఉంటే ఈ పారామీటర్ను ఉపయోగించండి",
          ko: "특정 체인이 필요한 앱이 있는 경우이 매개 변수를 사용하십시오",
          vi: "Sử dụng tham số này nếu một số ứng dụng yêu cầu một chuỗi cụ thể",
          pl: "Użyj tego parametru, jeśli niektóre aplikacje wymagają określonego łańcucha",
          ro: "Utilizați acest parametru dacă unele aplicații necesită un lanț specific",
          nl: "Gebruik deze parameter als sommige apps een specifieke keten vereisen",
          el: "Χρησιμοποιήστε αυτήν την παράμετρο αν κάποια εφαρμογή απαιτεί μια συγκεκριμένη αλυσίδα",
          th: "ใช้พารามิเตอร์นี้หากมีแอปพลิเคชันบางแอปที่ต้องการโซ่ที่เฉพาะเจาะจง",
          cs: "Použijte tento parametr, pokud některá aplikace vyžaduje konkrétní řetěz",
          hu: "Használja ezt a paramétert, ha egyes alkalmazások egy adott láncot igényelnek",
          sv: "Använd detta parameter om vissa appar kräver en specifik kedja",
          da: "Brug denne parameter, hvis nogle apps kræver en bestemt kæde"
        }, locale)}
      </div>
    </PageBody>
  </UserPage>
}