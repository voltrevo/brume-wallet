import { Outline } from "@/libs/icons/icons";
import { WideClickableNakedMenuAnchor } from "@/libs/ui/anchor";
import { useLocaleContext } from "@/mods/foreground/global/mods/locale";
import { Locale } from "@/mods/foreground/locale";
import { useCoords, usePathContext } from "@hazae41/chemin";

export function WalletCreatorMenu(props: {}) {
  const path = usePathContext().getOrThrow()
  const locale = useLocaleContext().getOrThrow()

  const readonly = useCoords(path, "/create/readonly")
  const standalone = useCoords(path, "/create/standalone")

  return <div className="flex flex-col text-left gap-2">
    <WideClickableNakedMenuAnchor
      onClick={standalone.onClick}
      onKeyDown={standalone.onKeyDown}
      href={standalone.href}>
      <Outline.WalletIcon className="size-4" />
      {Locale.get({
        en: "Standalone",
        zh: "独立",
        hi: "स्वतंत्र",
        es: "Independiente",
        ar: "مستقل",
        fr: "Indépendant",
        de: "Eigenständig",
        ru: "Автономный",
        pt: "Independente",
        ja: "スタンドアロン",
        pa: "ਸਵਤੰਤਰ",
        bn: "স্ট্যান্ডঅ্যালোন",
        id: "Mandiri",
        ur: "انفرادی",
        ms: "Berdiri sendiri",
        it: "Indipendente",
        tr: "Bağımsız",
        ta: "தன்னியக்க",
        te: "స్వతంత్ర",
        ko: "독립",
        vi: "Độc lập",
        pl: "Samodzielny",
        ro: "Independent",
        nl: "Standalone",
        el: "Αυτόνομο",
        th: "แยกต่างหาก",
        cs: "Samostatný",
        hu: "Független",
        sv: "Fristående",
        da: "Standalone"
      }, locale)}
    </WideClickableNakedMenuAnchor>
    <WideClickableNakedMenuAnchor
      onClick={readonly.onClick}
      onKeyDown={readonly.onKeyDown}
      href={readonly.href}>
      <Outline.EyeIcon className="size-4" />
      {Locale.get({
        en: "Read-only",
        zh: "只读",
        hi: "केवल पढ़ने योग्य",
        es: "Solo lectura",
        ar: "للقراءة فقط",
        fr: "Lecture seule",
        de: "Nur lesen",
        ru: "Только для чтения",
        pt: "Somente leitura",
        ja: "読み取り専用",
        pa: "ਕੇਵਲ ਪੜ੍ਹਨ ਲਈ",
        bn: "কেবল পড়ার জন্য",
        id: "Hanya baca",
        ur: "صرف پڑھنے کے لئے",
        ms: "Hanya baca",
        it: "Solo lettura",
        tr: "Sadece oku",
        ta: "வாசிக்க மட்டும்",
        te: "కేవలం చదవడానికి",
        ko: "읽기 전용",
        vi: "Chỉ đọc",
        pl: "Tylko do odczytu",
        ro: "Doar citire",
        nl: "Alleen lezen",
        el: "Μόνο για ανάγνωση",
        th: "อ่านอย่างเดียว",
        cs: "Pouze pro čtení",
        hu: "Csak olvasásra",
        sv: "Endast läsning",
        da: "Kun læsning"
      }, locale)}
    </WideClickableNakedMenuAnchor>
  </div>
}
