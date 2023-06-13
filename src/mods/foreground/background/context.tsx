import { ChildrenProps } from "@/libs/react/props/children";
import { createContext, useContext, useMemo } from "react";
import { Background, createExtensionBackgroundPool, createWebsiteBackgroundPool } from "./background";

export const BackgroundContext =
  createContext<Background | undefined>(undefined)

export function useBackground() {
  return useContext(BackgroundContext)!
}

export function WebsiteBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useMemo(() => {
    return createWebsiteBackgroundPool()
  }, [])

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}

export function ExtensionBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useMemo(() => {
    return createExtensionBackgroundPool()
  }, [])

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}