import { ChildrenProps } from "@/libs/react/props/children";
import { createContext, useContext, useMemo } from "react";
import { Backgrounds, createExtensionBackgroundPool, createWebsiteBackgroundPool } from "./background";

export const BackgroundsContext =
  createContext<Backgrounds | undefined>(undefined)

export function useBackgrounds() {
  return useContext(BackgroundsContext)!
}

export function WebsiteBackgroundsProvider(props: ChildrenProps) {
  const { children } = props

  const backgrounds = useMemo(() => {
    return createWebsiteBackgroundPool()
  }, [])

  return <BackgroundsContext.Provider value={backgrounds}>
    {children}
  </BackgroundsContext.Provider>
}

export function ExtensionBackgroundsProvider(props: ChildrenProps) {
  const { children } = props

  const backgrounds = useMemo(() => {
    return createExtensionBackgroundPool()
  }, [])

  return <BackgroundsContext.Provider value={backgrounds}>
    {children}
  </BackgroundsContext.Provider>
}