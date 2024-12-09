import { ContrastSubtitleDiv } from "@/libs/ui/div";
import { ContrastLabel } from "@/libs/ui/label";
import { GlobalPageHeader, PageBody } from "@/libs/ui/page/header";
import { GlobalPage } from "@/libs/ui/page/page";
import { HashSelector } from "@/libs/ui/select";
import { useCoords, useHashSubpath, usePathContext } from "@hazae41/chemin";
import { useState } from "react";

export function GlobalSettingsPage() {
  const path = usePathContext().getOrThrow()
  const hash = useHashSubpath(path)

  const [lang, setLang] = useState("auto")

  const hashLangCoords = useCoords(hash, "/lang")

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
            auto: "Auto",
            english: "English",
            french: "Français",
            spanish: "Español",
            german: "Deutsch",
            italian: "Italiano",
            portuguese: "Português",
            russian: "Русский",
            chinese: "中文",
            japanese: "日本語",
            korean: "한국어",
            arabic: "العربية",
            hindi: "हिन्दी",
            turkish: "Türkçe",
            vietnamese: "Tiếng Việt",
            thai: "ไทย",
            indonesian: "Bahasa Indonesia",
            malay: "Bahasa Melayu",
            filipino: "Filipino",
            dutch: "Nederlands",
            swedish: "Svenska",
            norwegian: "Norsk",
            danish: "Dansk",
            finnish: "Suomi",
            polish: "Polski",
            czech: "Čeština",
            slovak: "Slovenčina",
            hungarian: "Magyar",
            romanian: "Română",
            bulgarian: "Български",
            greek: "Ελληνικά",
            ukrainian: "Українська",
            belarusian: "Беларуская",
            serbian: "Српски",
            croatian: "Hrvatski",
            bosnian: "Bosanski",
            slovenian: "Slovenščina",
            macedonian: "Македонски",
            albanian: "Shqip",
            catalan: "Català",
            basque: "Euskara",
            galician: "Galego",
            esperanto: "Esperanto",
            latin: "Latina",
            haitian: "Kreyòl Ayisyen",
            creole: "Kriyòl",
            maori: "Māori",
            hawaiian: "ʻŌlelo Hawaiʻi",
            samoan: "Gagana Samoa",
            tahitian: "Reo Tahiti",
            fijian: "Na Vosa Vakaviti",
            tongan: "Lea Faka-Tonga",
            chamorro: "Finu' Chamoru",
            marianas: "Tinige' Marianas",
            palauan: "Tekoi er a Belau",
            marshallese: "Kajin Majōl",
            nauruan: "Dorerin Naoero",
            kiribati: "Taetae ni Kiribati",
            tuvaluan: "Te Ggana Tuuvalu",
            tokelauan: "Gagana Tokelau",
            niuean: "Vagahau Niue",
            cook: "Reo Māori Kūki 'Āirani",
          }}
        </HashSelector>
      </ContrastLabel>
    </PageBody>
  </GlobalPage>
}