import { ChildrenProps } from "@/libs/react/props/children";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Background, ExtensionBackground, WebsiteBackground } from "./background";

export const BackgroundContext =
  createContext<Background | undefined>(undefined)

export function useBackground() {
  return useContext(BackgroundContext)!
}

export function BackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const [extension, setExtension] = useState<boolean>()

  useEffect(() => {
    setExtension(location.protocol.endsWith("extension:"))
  }, [])

  if (extension == null)
    return null

  if (extension)
    return <ExtensionBackgroundProvider>
      {children}
    </ExtensionBackgroundProvider>

  return <WebsiteBackgroundProvider>
    {children}
  </WebsiteBackgroundProvider>
}

export function WebsiteBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useMemo(() => {
    return new WebsiteBackground()
  }, [])

  useEffect(() => {
    background.router.tryRequest({ method: "brume_log" }).then(r => r.ignore())
  }, [background])

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}

export function ExtensionBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useMemo(() => {
    return new ExtensionBackground()
  }, [])

  useEffect(() => {
    background.router.tryRequest({ method: "brume_log" }).then(r => r.ignore())
  }, [background])

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}