import { ChildrenProps } from "@/libs/react/props/children";
import { State } from "@/libs/react/state";
import { CloseContext } from "@/libs/ui/dialog/dialog";
import { Nullable, Option, Optional } from "@hazae41/option";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface PathHandle {
  /**
   * The relative URL
   */
  readonly url: URL

  /**
   * The absolute url if we go to the given path
   * @param path 
   */
  go(path: string): URL
}

export const PathContext =
  createContext<Nullable<PathHandle>>(undefined)

export function usePathContext() {
  return Option.wrap(useContext(PathContext))
}

export namespace Paths {

  export function spoof(url: URL) {
    return new URL(url.hash.slice(1), url.origin)
  }

  export function path(url: URL) {
    return url.pathname + url.search + url.hash
  }

  export function go(path: string) {
    location.hash = `#${path}`
  }

}

export function DefaultPathProvider(props: ChildrenProps) {
  const { children } = props

  const [url, setUrl] = useState<URL>()

  useEffect(() => {
    const onHashChange = () => setUrl(Paths.spoof(new URL(location.href)))

    setUrl(Paths.spoof(new URL(location.href)))

    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [])

  const go = useCallback((path: string) => {
    return new URL(`#${path}`, location.href)
  }, [])

  const handle = useMemo(() => {
    if (url == null)
      return
    return { url, go } satisfies PathHandle
  }, [url, go])

  if (handle == null)
    return null

  return <PathContext.Provider value={handle}>
    {children}
  </PathContext.Provider>
}

export function SubpathProvider(props: ChildrenProps) {
  const path = usePathContext().unwrap()
  const subpath = useSubpath2(path)

  const onClose = useCallback(() => {
    location.replace(subpath.go("/").href)
  }, [subpath])

  return <PathContext.Provider value={subpath}>
    <CloseContext.Provider value={onClose}>
      {props.children}
    </CloseContext.Provider>
  </PathContext.Provider>
}

export function useSubpath2(parent: PathHandle): PathHandle {
  const [url, setUrl] = useState<URL>(() => Paths.spoof(parent.url))

  useEffect(() => {
    setUrl(Paths.spoof(parent.url))
  }, [parent])

  const go = useCallback((path: string) => {
    return parent.go(Paths.path(new URL(`#${path}`, parent.url.href)))
  }, [parent])

  return useMemo(() => {
    return { url, go } satisfies PathHandle
  }, [url, go])
}

export function useSubpath(): PathHandle {
  const parent = usePathContext().unwrap()

  return useSubpath2(parent)
}

export function usePathState<T extends Record<string, Optional<string>>>() {
  const { url, go } = usePathContext().unwrap()

  const [state, setState] = useState<T>(() => Object.fromEntries(url.searchParams.entries()) as T)

  useEffect(() => {
    setState(Object.fromEntries(url.searchParams.entries()) as T)
  }, [url])

  useEffect(() => {
    if (state == null)
      return
    const filtered = Object.fromEntries(Object.entries(state).filter(([_, value]) => value != null) as [keyof T, string][])
    location.replace(go(`${url.pathname}?${new URLSearchParams(filtered).toString()}${url.hash}`).href)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return [state, setState] as const
}

export function useSearchState<T extends Record<string, Optional<string>>>(key: keyof T, $parent: State<T>) {
  const [parent, setParent] = $parent

  const state = parent[key]

  const setState = useCallback((value: T[typeof key]) => {
    setParent(p => ({ ...p, [key]: value }))
  }, [setParent, key])

  return [state, setState] as const
}
