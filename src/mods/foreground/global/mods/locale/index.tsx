import { Nullable, Option, Some } from "@hazae41/option";
import { createContext, useContext } from "react";

export const LocaleContext = createContext<Nullable<string>>(undefined)

export function useLocaleContext() {
  return Option.wrap(useContext(LocaleContext)).or(new Some(navigator.language.split("-")[0]))
}