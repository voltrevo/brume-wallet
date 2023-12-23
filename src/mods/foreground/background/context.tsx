import { ChildrenProps } from "@/libs/react/props/children";
import { useConstant } from "@/libs/react/ref";
import { Loading } from "@/libs/ui/loading/loading";
import { None, Option } from "@hazae41/option";
import { createContext, useContext, useEffect, useState } from "react";
import { Background, ExtensionBackground, WebsiteBackground } from "./background";

export const BackgroundContext =
  createContext<Background | undefined>(undefined)

export function useBackgroundContext() {
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

export function BackgroundGuard(props: ChildrenProps) {
  const { children } = props

  const background = useBackgroundContext().unwrap()

  const [size, setSize] = useState(background.ports.size)

  useEffect(() => {
    const onEvent = () => {
      setSize(background.ports.size)
      return new None()
    }

    background.ports.events.on("created", onEvent, { passive: true })
    background.ports.events.on("deleted", onEvent, { passive: true })

    setSize(background.ports.size)

    return () => {
      background.ports.events.off("created", onEvent)
      background.ports.events.off("deleted", onEvent)
    }
  }, [background])

  return <>
    {size < 1 &&
      <div className="z-50 absolute left-0 top-0 flex h-full w-full items-center justify-center bg-default">
        <Loading className="size-10" />
      </div>}
    {children}
  </>
}