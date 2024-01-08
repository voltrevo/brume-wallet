import { ChildrenProps } from "@/libs/react/props/children";
import { State } from "@/libs/react/state";
import { Nullable, Option } from "@hazae41/option";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface Path {
  readonly url: URL
  go(pathname: string): void
}

export const PathContext =
  createContext<Nullable<Path>>(undefined)

export function usePathContext() {
  return Option.wrap(useContext(PathContext))
}

export namespace Paths {

  export function spoof(parent = new URL(location.href)) {
    return new URL(parent.hash.slice(1), parent.origin)
  }

  export function path(url: URL) {
    return url.pathname + url.search + url.hash
  }

  export function go(path: string) {
    location.hash = `#${path}`
  }

}

export function PathProvider(props: ChildrenProps) {
  const { go } = Paths
  const { children } = props

  const [url, setUrl] = useState<URL>(() => Paths.spoof())

  useEffect(() => {
    const onHashChange = () => setUrl(Paths.spoof())

    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [])

  const handle = useMemo(() => {
    if (url == null)
      return
    return { url, go }
  }, [url, go])

  if (handle == null)
    return null

  return <PathContext.Provider value={handle}>
    {children}
  </PathContext.Provider>
}

export function useSubpath() {
  const parent = usePathContext().unwrap()

  const [url, setUrl] = useState<URL>(() => Paths.spoof(parent.url))

  useEffect(() => {
    setUrl(Paths.spoof(parent.url))
  }, [parent])

  const go = useCallback((path: string) => {
    parent.url.hash = `#${path}`
    parent.go(Paths.path(parent.url))
  }, [parent])

  const handle = useMemo(() => {
    return { url, go }
  }, [url, go])

  return handle
}

export function usePathState<T extends Record<string, string>>() {
  const { url, go } = usePathContext().unwrap()

  const [state, setState] = useState<T>(() => Object.fromEntries(url.searchParams.entries()) as T)

  useEffect(() => {
    setState(Object.fromEntries(url.searchParams.entries()) as T)
  }, [url])

  useEffect(() => {
    if (state == null)
      return
    const filtered = Object.fromEntries(Object.entries(state).filter(([_, value]) => value != null)) as T
    go(`${url.pathname}?${new URLSearchParams(filtered).toString()}${url.hash}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return [state, setState] as const
}

export function useSearchState<T extends Record<string, string>>(key: keyof T, $parent: State<T>) {
  const [parent, setParent] = $parent

  const state = parent[key]

  const setState = useCallback((value: T[typeof key]) => {
    setParent(p => ({ ...p, [key]: value }))
  }, [setParent, key])

  return [state, setState] as const
}
