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

  const stored = useLocaleQuery().data?.get()

  const locale = useMemo(() => {
    if (stored != null && stored !== "auto")
      return stored
    if (value != null)
      return value
    return navigator.language.split("-")[0]
  }, [stored, value])

  return <LocaleContext.Provider value={locale}>
    {children}
  </LocaleContext.Provider>
}