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

  export function hash(url: URL) {
    const hash = url.hash.slice(1)

    if (hash)
      return new URL(hash, url.origin)

    return new URL(url.origin)
  }

  export function search(url: URL, key: string) {
    const value = url.searchParams.get(key)

    if (value)
      return new URL(value, url.origin)

    return new URL(url.origin)
  }

  export function path(url: URL) {
    return url.pathname + url.search + url.hash
  }

  export function go(path: string) {
    location.assign(`#${path}`)
  }

}

export function HashPathProvider(props: ChildrenProps) {
  const { children } = props

  const [url, setUrl] = useState<URL>()

  useEffect(() => {
    const onHashChange = () => setUrl(Paths.hash(new URL(location.href)))

    setUrl(Paths.hash(new URL(location.href)))

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

export function HashSubpathProvider(props: ChildrenProps) {
  const path = usePathContext().unwrap()
  const subpath = useHashSubpath(path)

  const onClose = useCallback(() => {
    location.replace(subpath.go("/"))
  }, [subpath])

  return <PathContext.Provider value={subpath}>
    <CloseContext.Provider value={onClose}>
      {props.children}
    </CloseContext.Provider>
  </PathContext.Provider>
}

export function useHashSubpath(parent: PathHandle): PathHandle {
  const [url, setUrl] = useState<URL>(() => Paths.hash(parent.url))

  useEffect(() => {
    setUrl(Paths.hash(parent.url))
  }, [parent])

  const go = useCallback((path: string) => {
    const url = new URL(parent.url.href)
    url.hash = path
    return parent.go(Paths.path(url))
  }, [parent])

  return useMemo(() => {
    return { url, go } satisfies PathHandle
  }, [url, go])
}

export function useSearchSubpath(parent: PathHandle, key: string): PathHandle {
  const [url, setUrl] = useState<URL>(() => Paths.hash(parent.url))

  useEffect(() => {
    setUrl(Paths.search(parent.url, key))
  }, [key, parent])

  const go = useCallback((path: string) => {
    const url = new URL(parent.url.href)
    url.searchParams.set(key, path)
    return parent.go(Paths.path(url))
  }, [key, parent])

  return useMemo(() => {
    return { url, go } satisfies PathHandle
  }, [url, go])
}

export function usePathState<T extends Record<string, Optional<string>>>() {
  const path = usePathContext().unwrap()

  const [state, setState] = useState<T>(() => Object.fromEntries(path.url.searchParams) as T)

  useEffect(() => {
    setState(Object.fromEntries(path.url.searchParams) as T)
  }, [path])

  useEffect(() => {
    if (state == null)
      return

    const url = new URL(path.url.href)
    url.search = new URLSearchParams(Object.entries(state).filter(([, value]) => value != null) as any).toString()
    location.replace(path.go(Paths.path(url)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return [state, setState] as const
}

export function useKeyValueState<T extends Record<string, Optional<string>>>(key: keyof T, $parent: State<T>) {
  const [parent, setParent] = $parent

  const state = parent[key]

  const setState = useCallback((value: T[typeof key]) => {
    setParent(p => ({ ...p, [key]: value }))
  }, [setParent, key])

  return [state, setState] as const
}
