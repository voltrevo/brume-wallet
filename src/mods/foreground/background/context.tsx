import { ChildrenProps } from "@/libs/react/props/children";
import { useConstant } from "@/libs/react/ref";
import { Option } from "@hazae41/option";
import { createContext, useContext, useEffect, useState } from "react";
import { Background, ExtensionBackground, WebsiteBackground } from "./background";

export const BackgroundContext =
  createContext<Background | undefined>(undefined)

export function useBackground() {
  return Option.wrap(useContext(BackgroundContext))
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

  const background = useConstant(() => new WebsiteBackground())

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}

export function ExtensionBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useConstant(() => new ExtensionBackground())

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}