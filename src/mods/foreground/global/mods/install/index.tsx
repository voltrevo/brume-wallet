import { ChildrenProps } from "@/libs/react/props/children";
import { Nullable, Option } from "@hazae41/option";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface InstallEvent extends Event {
  prompt: () => void
}

export const InstallContext = createContext<Nullable<InstallEvent>>(undefined)

export function useInstallContext() {
  return Option.wrap(useContext(InstallContext))
}

export function InstallProvider(props: ChildrenProps) {
  const { children } = props

  const [install, setInstall] = useState<InstallEvent>()

  const onInstall = useCallback((e: Event) => {
    e.preventDefault()

    const install = e as InstallEvent

    setInstall(install)
  }, [])

  useEffect(() => {
    addEventListener("beforeinstallprompt", onInstall, { passive: true })
    return () => removeEventListener("beforeinstallprompt", onInstall)
  }, [])

  return <InstallContext.Provider value={install}>
    {children}
  </InstallContext.Provider>
}