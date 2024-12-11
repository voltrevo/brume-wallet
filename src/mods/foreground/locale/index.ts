import { Records } from "@/libs/records"

export type Locale =
  | "en"
  | "zh"
  | "hi"
  | "es"
  | "ar"
  | "fr"
  | "de"
  | "ru"
  | "pt"
  | "ja"
  | "pa"
  | "bn"
  | "id"
  | "ur"
  | "ms"
  | "it"
  | "tr"
  | "ta"
  | "te"
  | "ko"
  | "vi"
  | "pl"
  | "ro"
  | "nl"
  | "el"
  | "th"
  | "cs"
  | "hu"
  | "sv"
  | "da"

export type Localized = {
  [key in Locale]: string
}

export namespace Locale {

  export function get(localized: Localized, locale: string): string {
    const result = Records.getOrNull(localized, locale)

    if (result != null)
      return result

    return localized["en"]
  }

  export const Enter: Localized = {
    en: "Enter",
    zh: "输入",
    hi: "दर्ज करें",
    es: "Entrar",
    ar: "أدخل",
    fr: "Entrer",
    de: "Eintreten",
    ru: "Войти",
    pt: "Entrar",
    ja: "入る",
    pa: "ਦਾਖਲ ਹੋਵੋ",
    bn: "ঢুকুন",
    id: "Masuk",
    ur: "داخل ہونا",
    ms: "Masuk",
    it: "Entra",
    tr: "Girmek",
    ta: "உள்ளுக",
    te: "నమోదు",
    ko: "들어가다",
    vi: "Vào",
    pl: "Wejdź",
    ro: "Intra",
    nl: "Binnenkomen",
    el: "Μπείτε",
    th: "เข้า",
    cs: "Vstoupit",
    hu: "Belépés",
    sv: "Gå in",
    da: "Gå ind",
  }

  export const Home: Localized = {
    en: "Home",
    zh: "主页",
    hi: "होम",
    es: "Inicio",
    ar: "الصفحة الرئيسية",
    fr: "Accueil",
    de: "Zuhause",
    ru: "Главная",
    pt: "Casa",
    ja: "ホーム",
    pa: "ਘਰ",
    bn: "হোম",
    id: "Rumah",
    ur: "گھر",
    ms: "Rumah",
    it: "Casa",
    tr: "Ev",
    ta: "வீடு",
    te: "హోమ్",
    ko: "집",
    vi: "Nhà",
    pl: "Dom",
    ro: "Acasă",
    nl: "Huis",
    el: "Σπίτι",
    th: "บ้าน",
    cs: "Domov",
    hu: "Otthon",
    sv: "Hem",
    da: "Hjem",
  }

  export const Download: Localized = {
    en: "Download",
    zh: "下载",
    hi: "डाउनलोड",
    es: "Descargar",
    ar: "تحميل",
    fr: "Télécharger",
    de: "Herunterladen",
    ru: "Скачать",
    pt: "Baixar",
    ja: "ダウンロード",
    pa: "ਡਾਊਨਲੋਡ",
    bn: "ডাউনলোড",
    id: "Unduh",
    ur: "ڈاؤن لوڈ",
    ms: "Muat turun",
    it: "Scaricare",
    tr: "İndir",
    ta: "பதிவிறக்க",
    te: "డౌన్లోడ్",
    ko: "다운로드",
    vi: "Tải về",
    pl: "Pobierz",
    ro: "Descărca",
    nl: "Downloaden",
    el: "Λήψη",
    th: "ดาวน์โหลด",
    cs: "Stáhnout",
    hu: "Letöltés",
    sv: "Ladda ner",
    da: "Download",
  }

  export const Loading: Localized = {
    en: "Loading",
    zh: "载入中",
    hi: "लोड हो रहा है",
    es: "Cargando",
    ar: "جار التحميل",
    fr: "Chargement",
    de: "Wird geladen",
    ru: "Загрузка",
    pt: "Carregando",
    ja: "ロード中",
    pa: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ",
    bn: "লোড হচ্ছে",
    id: "Memuat",
    ur: "لوڈ ہو رہا ہے",
    ms: "Memuat",
    it: "Caricamento",
    tr: "Yükleniyor",
    ta: "ஏற்றுகிறது",
    te: "లోడ్ అవుతోంది",
    ko: "로드 중",
    vi: "Đang tải",
    pl: "Ładowanie",
    ro: "Se încarcă",
    nl: "Bezig met laden",
    el: "Φόρτωση",
    th: "กำลังโหลด",
    cs: "Načítání",
    hu: "Betöltés",
    sv: "Laddar",
    da: "Indlæser",
  }

  export const MoreDownloads: Localized = {
    en: "More downloads",
    zh: "更多下载",
    hi: "अधिक डाउनलोड",
    es: "Más descargas",
    ar: "المزيد من التنزيلات",
    fr: "Plus de téléchargements",
    de: "Mehr Downloads",
    ru: "Больше загрузок",
    pt: "Mais downloads",
    ja: "その他のダウンロード",
    pa: "ਹੋਰ ਡਾਊਨਲੋਡ",
    bn: "আরও ডাউনলোড",
    id: "Lebih banyak unduhan",
    ur: "مزید ڈاؤن لوڈ",
    ms: "Lebih muat turun",
    it: "Altri download",
    tr: "Daha fazla indirme",
    ta: "மேலும் பதிவிறக்கங்கள்",
    te: "మరిన్ని డౌన్లోడ్లు",
    ko: "더 많은 다운로드",
    vi: "Tải về nhiều hơn",
    pl: "Więcej pobrań",
    ro: "Mai multe descărcări",
    nl: "Meer downloads",
    el: "Περισσότερες λήψεις",
    th: "ดาวน์โหลดเพิ่มเติม",
    cs: "Více stahování",
    hu: "Több letöltés",
    sv: "Fler nedladdningar",
    da: "Flere downloads",
  }

  export const MadeByCypherpunks: Localized = {
    en: "Made by cypherpunks",
    zh: "由 cypherpunks 制作",
    hi: "साइफरपंक्स द्वारा बनाया गया",
    es: "Hecho por cypherpunks",
    ar: "صنعها cypherpunks",
    fr: "Fait par des cypherpunks",
    de: "Hergestellt von Cypherpunks",
    ru: "Сделано киберпанками",
    pt: "Feito por cypherpunks",
    ja: "サイファーパンクス製",
    pa: "cypherpunks ਵਲੋਂ ਬਣਾਇਆ ਗਿਆ",
    bn: "cypherpunks দ্বারা তৈরি",
    id: "Dibuat oleh cypherpunks",
    ur: "cypherpunks کی طرف سے بنایا گیا",
    ms: "Dibuat oleh cypherpunks",
    it: "Realizzato da cypherpunks",
    tr: "Cypherpunks tarafından yapıldı",
    ta: "cypherpunks ஆல் உருவாக்கப்பட்டது",
    te: "cypherpunks ద్వారా తయారు",
    ko: "사이퍼펑크가 만듦",
    vi: "Được làm bởi cypherpunks",
    pl: "Zrobione przez cypherpunks",
    ro: "Făcut de cypherpunks",
    nl: "Gemaakt door cypherpunks",
    el: "Φτιαγμένο από cypherpunks",
    th: "ทำโดย cypherpunks",
    cs: "Vytvořeno cypherpunks",
    hu: "Cypherpunks által készítve",
    sv: "Gjord av cypherpunks",
    da: "Lavet af cypherpunks",
  }

  export const NewUser: Localized = {
    en: "New user",
    zh: "新用户",
    hi: "नया उपयोगकर्ता",
    es: "Nuevo usuario",
    ar: "مستخدم جديد",
    fr: "Nouvel utilisateur",
    de: "Neuer Benutzer",
    ru: "Новый пользователь",
    pt: "Novo usuário",
    ja: "新規ユーザー",
    pa: "ਨਵਾਂ ਯੂਜ਼ਰ",
    bn: "নতুন ব্যবহারকারী",
    id: "Pengguna baru",
    ur: "نیا صارف",
    ms: "Pengguna baru",
    it: "Nuovo utente",
    tr: "Yeni kullanıcı",
    ta: "புதிய பயனர்",
    te: "కొత్త వినియోగదారు",
    ko: "새로운 사용자",
    vi: "Người dùng mới",
    pl: "Nowy użytkownik",
    ro: "Utilizator nou",
    nl: "Nieuwe gebruiker",
    el: "Νέος χρήστης",
    th: "ผู้ใช้ใหม่",
    cs: "Nový uživatel",
    hu: "Új felhasználó",
    sv: "Ny användare",
    da: "Ny bruger",
  }

  export const tellMeWhatYouWant: Localized = {
    en: "tell me what you want",
    zh: "告诉我你想要什么",
    hi: "मुझे बताओ तुम्हें क्या चाहिए",
    es: "dime qué quieres",
    ar: "قل لي ما تريد",
    fr: "dis-moi ce que tu veux",
    de: "sag mir, was du willst",
    ru: "скажи мне, что ты хочешь",
    pt: "diz-me o que queres",
    ja: "欲しいものを教えて",
    pa: "ਮੈਨੂੰ ਦੱਸੋ ਤੁਸੀਂ ਕੀ ਚਾਹੁੰਦੇ ਹੋ",
    bn: "আমাকে বলুন আপনি কি চান",
    id: "beritahu saya apa yang kamu inginkan",
    ur: "مجھے بتاؤ تم چاہتے کیا ہو",
    ms: "beritahu saya apa yang anda mahu",
    it: "dimmi cosa vuoi",
    tr: "bana ne istediğini söyle",
    ta: "உங்கள் விரு  க்கியதை சொ  ல்லுங்கள்",
    te: "మీరు ఏమి కావాలన్న చెప్పండి",
    ko: "무엇을 원하는지 말해줘",
    vi: "nói cho tôi biết bạn muốn gì",
    pl: "powiedz mi, czego chcesz",
    ro: "spune-mi ce vrei",
    nl: "vertel me wat je wilt",
    el: "πες μου τι θες",
    th: "บอกฉันว่าคุณต้องการอะไร",
    cs: "řekni mi, co chceš",
    hu: "mond el, mit szeretnél",
    sv: "berätta för mig vad du vill",
    da: "fortæl mig hvad du vil",
  }

  export const Settings: Localized = {
    en: "Settings",
    zh: "设置",
    hi: "सेटिंग्स",
    es: "Configuración",
    ar: "الإعدادات",
    fr: "Paramètres",
    de: "Einstellungen",
    ru: "Настройки",
    pt: "Configurações",
    ja: "設定",
    pa: "ਸੈਟਿੰਗਾਂ",
    bn: "সেটিংস",
    id: "Pengaturan",
    ur: "ترتیبات",
    ms: "Tetapan",
    it: "Impostazioni",
    tr: "Ayarlar",
    ta: "அமைப்புகள்",
    te: "అమరికలు",
    ko: "설정",
    vi: "Cài đặt",
    pl: "Ustawienia",
    ro: "Setări",
    nl: "Instellingen",
    el: "Ρυθμίσεις",
    th: "การตั้งค่า",
    cs: "Nastavení",
    hu: "Beállítások",
    sv: "Inställningar",
    da: "Indstillinger",
  }

}