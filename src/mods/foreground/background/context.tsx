import { ChildrenProps } from "@/libs/react/props/children";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Background, BackgroundEvents, ExtensionBackground, WebsiteBackground, createMessageChannelPool, createPortPool } from "./background";

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

  if (extension === undefined)
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

  const events = useRef<BackgroundEvents>()

  if (events.current === undefined)
    events.current = { onMessage: [] }

  const background = useMemo(() => {
    return new WebsiteBackground(createMessageChannelPool(events.current!), events.current!)
  }, [])

  useEffect(() => {
    background.tryRequest({ method: "brume_log" }).then(r => r.ignore())
  }, [background])

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}

export function ExtensionBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const events = useRef<BackgroundEvents>()

  if (events.current === undefined)
    events.current = { onMessage: [] }

  const background = useMemo(() => {
    return new ExtensionBackground(createPortPool(events.current!), events.current!)
  }, [])

  useEffect(() => {
    background.tryRequest({ method: "brume_log" }).then(r => r.ignore())
  }, [background])

  return <BackgroundContext.Provider value={background}>
    {children}
  </BackgroundContext.Provider>
}