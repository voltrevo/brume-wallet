import { browser } from "@/libs/browser/browser";
import { ChildrenProps } from "@/libs/react/props/children";
import { createContext, useContext, useMemo } from "react";
import { Background, ExtensionBackground, WebsiteBackground } from "./background";

export const BackgroundContext =
  createContext<Background | undefined>(undefined)

export function useBackground() {
  return useContext(BackgroundContext)!
}

export function WebsiteBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useMemo(() => {
    const channel = new MessageChannel()

    navigator.serviceWorker.ready.then(r =>
      r.active!.postMessage("HELLO_WORLD", [channel.port2]))

    channel.port1.start()

    return new WebsiteBackground(channel)
  }, [])

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}

export function ExtensionBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useMemo(() => {
    const port = browser.runtime.connect({ name: "foreground" })

    return new ExtensionBackground(port)
  }, [])

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}