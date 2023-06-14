import { ChildrenProps } from "@/libs/react/props/children";
import { createContext, useContext, useMemo } from "react";
import { Background, ExtensionBackground, WebsiteBackground, createMessageChannelPool, createPortPool } from "./background";

export const BackgroundContext =
  createContext<Background | undefined>(undefined)

export function useBackground() {
  return useContext(BackgroundContext)!
}

export function WebsiteBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useMemo(() => {
    return new WebsiteBackground(createMessageChannelPool())
  }, [])

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}

export function ExtensionBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useMemo(() => {
    return new ExtensionBackground(createPortPool())
  }, [])

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}