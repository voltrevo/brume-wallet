import { ChildrenProps } from "@/libs/react/props/children";
import { State } from "@/libs/react/state";
import { CloseContext } from "@/libs/ui/dialog/dialog";
import { Nullable, Option, Optional } from "@hazae41/option";
import { SetStateAction, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

  const [raw, setRaw] = useState<string>()

  const url = useMemo(() => {
    if (raw == null)
      return
    return Paths.hash(new URL(raw))
  }, [raw])

  useEffect(() => {
    const onHashChange = () => setRaw(location.href)

    setRaw(location.href)

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
  const url = useMemo(() => {
    return Paths.hash(parent.url)
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
  const url = useMemo(() => {
    return Paths.search(parent.url, key)
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

  const state = useMemo(() => {
    return Object.fromEntries(path.url.searchParams) as T
  }, [path])

  const setState = useCallback((action: SetStateAction<T>) => {
    const next = typeof action === "function"
      ? action(state)
      : action

    const url = new URL(path.url.href)
    const entries = Object.entries(next).filter(([_, value]) => value != null)
    url.search = new URLSearchParams(entries as any).toString()

    if (path.url.href === url.href)
      return

    location.replace(path.go(Paths.path(url)))
  }, [state, path])

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
