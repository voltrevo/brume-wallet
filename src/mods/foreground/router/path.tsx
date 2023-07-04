import { ChildrenProps } from "@/libs/react/props/children";
import { Option, Optional } from "@hazae41/option";
import { createContext, useContext, useEffect, useState } from "react";

export const PathContext =
  createContext<Optional<URL>>(undefined)

export function usePath() {
  return Option.unwrap(useContext(PathContext))
}

export namespace Path {

  export function spoof() {
    return new URL(location.hash.slice(1), location.origin)
  }

  export function go(pathname: string) {
    location.hash = `#${pathname}`
  }

}

export function PathProvider(props: ChildrenProps) {
  const { children } = props

  const [path, setPath] = useState<URL>()

  useEffect(() => {
    setPath(Path.spoof())

    const onHashChange = () => setPath(Path.spoof())

    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [])

  if (path == null)
    return null

  return <PathContext.Provider value={path}>
    {children}
  </PathContext.Provider>
}