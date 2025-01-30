import { useLocaleContext } from "../../global/mods/locale"
import { Locale } from "../../locale"

export function ThreeChart() {
  const locale = useLocaleContext().getOrThrow()

  return <div className="p-4 bg-default-contrast rounded-xl">
    <div className="font-medium text-xl">
      {Locale.get({
        en: "Number of external dependencies",
        zh: "外部依赖项数量",
        hi: "बाह्य निर्भरता की संख्या",
        es: "Número de dependencias externas",
        ar: "عدد التبعيات الخارجية",
        fr: "Nombre de dépendances externes",
        de: "Anzahl der externen Abhängigkeiten",
        ru: "Количество внешних зависимостей",
        pt: "Número de dependências externas",
        ja: "外部依存関係の数",
        pa: "ਬਾਹਰੀ ਨਿਰਭਰਤਾ ਦੀ ਗਿਣਤੀ",
        bn: "বাহ্যিক নির্ভরতা সংখ্যা",
        id: "Jumlah dependensi eksternal",
        ur: "بیرونی وابستگیوں کی تعداد",
        ms: "Bilangan dependensi luaran",
        it: "Numero di dipendenze esterne",
        tr: "Dış bağımlılıkların sayısı",
        ta: "வெளி உதவிகளின் எண்ணிக்கை",
        te: "బాహ్య ఆధారాల సంఖ్య",
        ko: "외부 종속성 수",
        vi: "Số lượng phụ thuộc bên ngoài",
        pl: "Liczba zależności zewnętrznych",
        ro: "Numărul de dependențe externe",
        nl: "Aantal externe afhankelijkheden",
        el: "Αριθμός εξωτερικών εξαρτήσεων",
        th: "จำนวนของความขึ้นอยู่กับภายนอก",
        cs: "Počet externích závislostí",
        hu: "Külső függőségek száma",
        sv: "Antal externa beroenden",
        da: "Antal eksterne afhængigheder"
      }, locale)}
    </div>
    <div className="text-default-contrast">
      {Locale.get({
        en: `Took from package.json — Lower is better`,
        zh: `从 package.json 中提取 — 越低越好`,
        hi: `पैकेज.जेएसन से लिया गया — कम होना बेहतर है`,
        es: `Tomado de package.json — Menor es mejor`,
        ar: `أخذ من package.json — كلما كان أقل كان أفضل`,
        fr: `Depuis package.json — Plus c'est bas, mieux c'est`,
        de: `Aus package.json entnommen — Je niedriger, desto besser`,
        ru: `Взято из package.json — Чем меньше, тем лучше`,
        pt: `Retirado de package.json — Quanto menor, melhor`,
        ja: `package.json から取得 — 小さいほど良い`,
        pa: `ਪੈਕੇਜ.ਜੇਸਨ ਤੋਂ ਲਿਆ — ਘੱਟ ਹੋਣਾ ਵਧੀਆ ਹੈ`,
        bn: `package.json থেকে নেওয়া — কম হলে ভাল`,
        id: `Diambil dari package.json — Semakin rendah semakin baik`,
        ur: `پیکیج.جے این سے لیا گیا — کم ہونا بہتر ہے`,
        ms: `Diambil dari package.json — Semakin rendah semakin baik`,
        it: `Preso da package.json — Più basso è meglio`,
        tr: `package.json'dan alındı — Daha düşük daha iyidir`,
        ta: `package.json இலிருந்து எடுக்கப்பட்டது — குறைந்தது சிறந்தது`,
        te: `ప్యాకేజ్.జెసన్ నుండి తీసుకున్నది — తక్కువగా ఉండటం మంచిది`,
        ko: `package.json에서 가져옴 — 낮을수록 좋음`,
        vi: `Lấy từ package.json — Càng thấp càng tốt`,
        pl: `Wzięte z package.json — Im niższa, tym lepiej`,
        ro: `Luat din package.json — Cu cât este mai mic, cu atât este mai bine`,
        nl: `Genomen uit package.json — Hoe lager hoe beter`,
        el: `Πήρε από το package.json — Όσο χαμηλότερο τόσο καλύτερο`,
        th: `เอาจาก package.json — ต่ำกว่าดี`,
        cs: `Vzato z package.json — Čím nižší, tím lépe`,
        hu: `Vett a package.json-ból — Minél alacsonyabb, annál jobb`,
        sv: `Tog från package.json — Lägre är bättre`,
        da: `Taget fra package.json — Jo lavere, jo bedre`
      }, locale)}
    </div>
    <div className="h-4" />
    <div className="w-full">
      <div className={`rounded-xl bg-default-contrast h-12 px-4 w-[60.25%] flex items-center gap-2`}>
        <div className=""
          dir="ltr">
          MetaMask
        </div>
        <div className="text-default-contrast"
          dir="ltr">
          ~720
        </div>
      </div>
      <div className="h-2" />
      <div className={`rounded-xl bg-default-contrast h-12 px-4 w-[95.8%] flex items-center gap-2`}>
        <div className=""
          dir="ltr">
          Rabby
        </div>
        <div className="text-default-contrast"
          dir="ltr">
          ~1150
        </div>
      </div>
      <div className="h-2" />
      <div className={`rounded-xl bg-default-contrast h-12 px-4 w-[64.8%] flex items-center gap-2`}>
        <div className=""
          dir="ltr">
          Rainbow
        </div>
        <div className="text-default-contrast"
          dir="ltr">
          ~780
        </div>
      </div>
      <div className="h-2" />
      <div className="w-full flex items-center">
        <div className={`rounded-xl bg-white text-black h-12 px-4 w-[4.25%] flex items-center gap-2`} />
        <div className="w-4" />
        <div className="flex items-center gap-2">
          <div className=""
            dir="ltr">
            Brume
          </div>
          <div className="text-default-contrast"
            dir="ltr">
            ~50
          </div>
        </div>
      </div>
    </div>
  </div>
}