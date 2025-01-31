import { ChildrenProps } from "@/libs/react/props/children";
import { ValueProps } from "@/libs/react/props/value";
import { Locale } from "@/mods/foreground/locale";
import { Nullable, Option } from "@hazae41/option";
import { createContext, useContext, useMemo } from "react";

export const LocaleContext = createContext<Nullable<string>>(undefined)

export function useLocaleContext() {
  return Option.wrap(useContext(LocaleContext))
}

export function Localizer(props: ValueProps<Nullable<string>> & ChildrenProps) {
  const { value, children } = props

  const browser = useMemo(() => {
    return navigator.language.split("-")[0]
  }, [])

  const locale = useMemo(() => {
    return value || browser
  }, [value, browser])

  return <LocaleContext value={locale}>
    {children}
  </LocaleContext>
}

export function Director(props: ChildrenProps) {
  const locale = useLocaleContext().getOrThrow()
  const { children } = props

  const direction = useMemo(() => {
    return Locale.get(Locale.direction, locale)
  }, [locale])

  return <div className="h-full w-full overflow-hidden"
    dir={direction}>
    {children}
  </div>
}