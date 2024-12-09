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
            spanish: "Español"
          }}
        </HashSelector>
      </ContrastLabel>
    </PageBody>
  </GlobalPage>
}