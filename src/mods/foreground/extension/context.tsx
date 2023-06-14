import { ChildrenProps } from "@/libs/react/props/children"
import { createContext, useContext, useEffect, useState } from "react"

export const ExtensionContext =
  createContext<boolean | undefined>(undefined)

export function useExtension() {
  return useContext(ExtensionContext)!
}

export function ExtensionProvider(props: ChildrenProps) {
  const { children } = props

  const [extension, setExtension] = useState<boolean>()

  useEffect(() => {
    setExtension(location.protocol.endsWith("extension:"))
  }, [])

  if (extension === undefined)
    return <>No extension</>

  return <ExtensionContext.Provider value={extension}>
    {children}
  </ExtensionContext.Provider>
}