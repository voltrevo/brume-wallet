import { ChildrenProps } from "@/libs/react/props/children";
import { createContext, useMemo } from "react";
import { Background, ExtensionBackground, WebsiteBackground } from "./background";

export const BackgroundContext =
  createContext<Background | undefined>(undefined)

export function WebsiteBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useMemo(() => {
    return new WebsiteBackground()
  }, [])

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}

export function ExtensionBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useMemo(() => {
    return new ExtensionBackground()
  }, [])

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}