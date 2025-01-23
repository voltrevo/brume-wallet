import { Errors } from "@/libs/errors/errors"
import { Outline } from "@/libs/icons/icons"
import { Objects } from "@/libs/objects/objects"
import { OblongPageHeader, PageBody } from "@/libs/ui/page/header"
import { GlobalPage } from "@/libs/ui/page/page"
import { useLocaleContext, useLocaleQuery } from "@/mods/foreground/global/mods/locale"
import { Data } from "@hazae41/glacier"
import { Some } from "@hazae41/option"
import { Fragment, useCallback } from "react"
import { Locale } from "../.."

export function LocalePage() {
  const lang = useLocaleContext().getOrThrow()

  const localeQuery = useLocaleQuery()
  const [localeData = "auto"] = [localeQuery.data?.get()]

  const onLocaleChange = useCallback((value: string) => Errors.runOrLogAndAlert(async () => {
    await localeQuery.mutateOrThrow(() => new Some(new Data(value)))
  }), [localeQuery.mutateOrThrow])

  return <GlobalPage>
    <OblongPageHeader title={Locale.get(Locale.Language, lang)} />
    <PageBody>
      <div className="bg-contrast rounded-xl overflow-hidden">
        {Objects.entries({
          auto: ["Automatic", Locale.Automatic],
          en: ["English", Locale.English],
          zh: ["中文", Locale.Chinese],
          hi: ["हिन्दी", Locale.Hindi],
          es: ["Español", Locale.Spanish],
          ar: ["العربية", Locale.Arabic],
          fr: ["Français", Locale.French],
          de: ["Deutsch", Locale.German],
          ru: ["Русский", Locale.Russian],
          pt: ["Português", Locale.Portuguese],
          ja: ["日本語", Locale.Japanese],
          pa: ["ਪੰਜਾਬੀ", Locale.Punjabi],
          bn: ["বাংলা", Locale.Bengali],
          id: ["Bahasa Indonesia", Locale.Indonesian],
          ur: ["اردو", Locale.Urdu],
          ms: ["Bahasa Melayu", Locale.Malay],
          it: ["Italiano", Locale.Italian],
          tr: ["Türkçe", Locale.Turkish],
          ta: ["தமிழ்", Locale.Tamil],
          te: ["తెలుగు", Locale.Telugu],
          ko: ["한국어", Locale.Korean],
          vi: ["Tiếng Việt", Locale.Vietnamese],
          pl: ["Polski", Locale.Polish],
          ro: ["Română", Locale.Romanian],
          nl: ["Nederlands", Locale.Dutch],
          el: ["Ελληνικά", Locale.Greek],
          th: ["ไทย", Locale.Thai],
          cs: ["Čeština", Locale.Czech],
          hu: ["Magyar", Locale.Hungarian],
          sv: ["Svenska", Locale.Swedish],
          da: ["Dansk", Locale.Danish]
        } as const).map(([key, [unlocalized, localized]]) =>
          <Fragment key={key}>
            <button className="p-4 w-full text-left flex items-center outline-none whitespace-nowrap enabled:hover:bg-contrast-hover focus-visible:outline-contrast disabled:opacity-50 transition-opacity"
              onClick={() => onLocaleChange(key)}>
              <div className="flex-none flex flex-col">
                <div>
                  {unlocalized}
                </div>
                <div className="text-contrast">
                  {Locale.get(localized, lang)}
                </div>
              </div>
              <div className="grow" />
              {key === localeData &&
                <div className="p-2">
                  <Outline.CheckIcon className="size-5" />
                </div>}
            </button>
          </Fragment>)}
      </div>
    </PageBody>
  </GlobalPage>

}