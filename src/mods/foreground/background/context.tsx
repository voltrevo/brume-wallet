import { isAndroidApp, isAppleApp, isExtension, isWebsite } from "@/libs/platform/platform";
import { ChildrenProps } from "@/libs/react/props/children";
import { useConstant } from "@/libs/react/ref";
import { Nullable, Option } from "@hazae41/option";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Background, ExtensionBackground, ServiceWorkerBackground, WorkerBackground } from "./background";

export interface ServiceWorkerUpdateHandle {
  readonly update: () => void
  readonly ignore: () => void
}

export const ServiceWorkerUpdateContext = createContext<Nullable<ServiceWorkerUpdateHandle>>(undefined)

export function useServiceWorkerUpdateContext() {
  return Option.wrap(useContext(ServiceWorkerUpdateContext))
}

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

  const [update, setUpdate] = useState<() => void>()

  const background = useConstant(() => new ServiceWorkerBackground())

  useEffect(() => {
    return background.serviceWorker.on("update", (update) => setUpdate(() => update))
  }, [background])

  const ignore = useCallback(() => {
    setUpdate(undefined)
  }, [])

  const handle = useMemo(() => {
    if (update == null)
      return
    return { update, ignore }
  }, [update, ignore])

  return <BackgroundContext value={background}>
    <ServiceWorkerUpdateContext value={handle}>
      {children}
    </ServiceWorkerUpdateContext>
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