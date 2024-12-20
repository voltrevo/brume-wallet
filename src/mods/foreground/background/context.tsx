import { isAndroidApp, isAppleApp, isExtension, isWebsite } from "@/libs/platform/platform";
import { ChildrenProps } from "@/libs/react/props/children";
import { useConstant } from "@/libs/react/ref";
import { Option } from "@hazae41/option";
import { createContext, useContext, useEffect, useState } from "react";
import { Background, ExtensionBackground, ServiceWorkerBackground, WorkerBackground } from "./background";

export const BackgroundContext =
  createContext<Background | undefined>(undefined)

export function useBackgroundContext() {
  return Option.wrap(useContext(BackgroundContext))
}

export function BackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const [client, setClient] = useState(false)

  useEffect(() => {
    setClient(true)
  }, [])

  if (!client)
    return null

  if (isExtension())
    return <ExtensionBackgroundProvider>
      {children}
    </ExtensionBackgroundProvider>

  if (isWebsite() || isAndroidApp())
    return <ServiceWorkerBackgroundProvider>
      {children}
    </ServiceWorkerBackgroundProvider>

  if (isAppleApp())
    return <WorkerBackgroundProvider>
      {children}
    </WorkerBackgroundProvider>

  return null
}

export function ServiceWorkerBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useConstant(() => new ServiceWorkerBackground())

  return <BackgroundContext value={background}>
    {children}
  </BackgroundContext>
}

export function WorkerBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useConstant(() => new WorkerBackground())

  return <BackgroundContext value={background}>
    {children}
  </BackgroundContext>
}

export function ExtensionBackgroundProvider(props: ChildrenProps) {
  const { children } = props

  const background = useConstant(() => new ExtensionBackground())

  return <BackgroundContext value={background}>
    {children}
  </BackgroundContext>
}