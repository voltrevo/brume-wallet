import { ChildrenProps } from "@/libs/react/props/children";
import { ValueProps } from "@/libs/react/props/value";
import { LocaleQuery } from "@/mods/universal/locale";
import { useQuery } from "@hazae41/glacier";
import { Nullable, Option } from "@hazae41/option";
import { createContext, useContext, useMemo } from "react";
import { useGlobalStorageContext } from "../storage";

export const LocaleContext = createContext<Nullable<string>>(undefined)

export function useLocaleContext() {
  return Option.wrap(useContext(LocaleContext))
}

export function useLocaleQuery() {
  const storage = useGlobalStorageContext().getOrThrow()
  const query = useQuery(LocaleQuery.queryOrThrow, [storage])

  return query
}

export function LocaleProvider(props: ChildrenProps & ValueProps<Nullable<string>>) {
  const { children, value } = props

  const [stored = "auto"] = [useLocaleQuery().data?.get()]

  const locale = useMemo(() => {
    if (value != null)
      return value
    if (stored !== "auto")
      return stored
    return navigator.language.split("-")[0]
  }, [value, stored])

  return <LocaleContext.Provider value={locale}>
    {children}
  </LocaleContext.Provider>
}