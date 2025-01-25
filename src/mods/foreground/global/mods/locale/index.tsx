import { Option } from "@hazae41/option";
import { createContext, useContext } from "react";

export const LocaleContext = createContext<string>(navigator.language.split("-")[0])

export function useLocaleContext() {
  return Option.wrap(useContext(LocaleContext))
}