import { ContrastSubtitleDiv } from "@/libs/ui/div";
import { ContrastLabel } from "@/libs/ui/label";
import { GlobalPageHeader, PageBody } from "@/libs/ui/page/header";
import { GlobalPage } from "@/libs/ui/page/page";
import { HashSelector } from "@/libs/ui/select";
import { useState } from "react";

export function GlobalSettingsPage() {
  const [lang, setLang] = useState("auto")

  return <GlobalPage>
    <GlobalPageHeader title="Settings" />
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
          pathname="/lang"
          value={lang}
          ok={setLang}>
          {{
            "auto": "Auto",
            "en": "English",
            "zh": "Chinese (Mandarin)",
            "hi": "Hindi",
            "es": "Spanish",
            "ar": "Arabic",
            "fr": "French",
            "de": "German",
            "ru": "Russian",
            "pt": "Portuguese",
            "ja": "Japanese",
            "pa": "Punjabi",
            "bn": "Bengali",
            "id": "Indonesian",
            "ur": "Urdu",
            "ms": "Malay",
            "it": "Italian",
            "tr": "Turkish",
            "ta": "Tamil",
            "te": "Telugu",
            "ko": "Korean",
            "vi": "Vietnamese",
            "pl": "Polish",
            "ro": "Romanian",
            "nl": "Dutch",
            "el": "Greek",
            "th": "Thai",
            "cs": "Czech",
            "hu": "Hungarian",
            "sv": "Swedish",
            "da": "Danish"
          }}
        </HashSelector>
      </ContrastLabel>
    </PageBody>
  </GlobalPage>
}