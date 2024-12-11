import { Errors } from "@/libs/errors/errors";
import { ContrastSubtitleDiv } from "@/libs/ui/div";
import { ContrastLabel } from "@/libs/ui/label";
import { GlobalPageHeader, PageBody } from "@/libs/ui/page/header";
import { GlobalPage } from "@/libs/ui/page/page";
import { HashSelector } from "@/libs/ui/select";
import { Locale } from "@/mods/foreground/locale";
import { Data } from "@hazae41/glacier";
import { Some } from "@hazae41/option";
import { useCallback } from "react";
import { useLocaleContext, useLocaleQuery } from "../../../locale";

export function GlobalSettingsPage() {
  const lang = useLocaleContext().getOrThrow()

  const localeQuery = useLocaleQuery()
  const [localeData = "auto"] = [localeQuery.data?.get()]

  const onLocaleChange = useCallback((value: string) => Errors.runOrLogAndAlert(async () => {
    await localeQuery.mutateOrThrow(() => new Some(new Data(value)))
  }), [])

  return <GlobalPage>
    <GlobalPageHeader title={Locale.get(Locale.Settings, lang)} />
    <PageBody>
      <ContrastSubtitleDiv>
        Language
      </ContrastSubtitleDiv>
      <ContrastLabel>
        <div className="flex-none">
          Language
        </div>
        <div className="w-4 grow" />
        <HashSelector
          pathname="/locale"
          value={localeData}
          ok={onLocaleChange}>
          {{
            "auto": "Auto",
            "en": "English",
            "zh": "中文",
            "hi": "हिन्दी",
            "es": "Español",
            "ar": "العربية",
            "fr": "Français",
            "de": "Deutsch",
            "ru": "Русский",
            "pt": "Português",
            "ja": "日本語",
            "pa": "ਪੰਜਾਬੀ",
            "bn": "বাংলা",
            "id": "Bahasa Indonesia",
            "ur": "اردو",
            "ms": "Bahasa Melayu",
            "it": "Italiano",
            "tr": "Türkçe",
            "ta": "தமிழ்",
            "te": "తెలుగు",
            "ko": "한국어",
            "vi": "Tiếng Việt",
            "pl": "Polski",
            "ro": "Română",
            "nl": "Nederlands",
            "el": "Ελληνικά",
            "th": "ไทย",
            "cs": "Čeština",
            "hu": "Magyar",
            "sv": "Svenska",
            "da": "Dansk"
          }}
        </HashSelector>
      </ContrastLabel>
    </PageBody>
  </GlobalPage>
}