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
  go(pathOrUrl: string | URL): URL
}

export const PathContext =
  createContext<Nullable<PathHandle>>(undefined)

export function usePathContext() {
  return Option.wrap(useContext(PathContext))
}

export namespace Paths {

  export function hash(pathOrUrl: string | URL) {
    const url = new URL(pathOrUrl, location.href)
    const hash = url.hash.slice(1)

    if (hash)
      return new URL(hash, url.origin)

    return new URL(url.origin)
  }

  export function search(pathOrUrl: string | URL, key: string) {
    const url = new URL(pathOrUrl, location.href)
    const value = url.searchParams.get(key)

    if (value)
      return new URL(value, url.origin)

    return new URL(url.origin)
  }

  export function path(pathOrUrl: string | URL) {
    const url = new URL(pathOrUrl, location.href)
    return url.pathname + url.search + url.hash
  }

}

export function HashPathProvider(props: ChildrenProps) {
  const { children } = props

  const [raw, setRaw] = useState<string>()

  const url = useMemo(() => {
    if (raw == null)
      return
    return Paths.hash(raw)
  }, [raw])

  useEffect(() => {
    setRaw(location.href)

    const onHashChange = () => setRaw(location.href)

    addEventListener("hashchange", onHashChange, { passive: true })
    return () => removeEventListener("hashchange", onHashChange)
  }, [])

  const go = useCallback((pathOrUrl: string | URL) => {
    return new URL(`#${Paths.path(pathOrUrl)}`, location.href)
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

  const go = useCallback((pathOrUrl: string | URL) => {
    const next = new URL(parent.url.href, location.href)
    next.hash = Paths.path(pathOrUrl)
    return parent.go(next)
  }, [parent])

  return useMemo(() => {
    return { url, go } satisfies PathHandle
  }, [url, go])
}

export function useSearchSubpath(parent: PathHandle, key: string): PathHandle {
  const url = useMemo(() => {
    return Paths.search(parent.url, key)
  }, [key, parent])

  const go = useCallback((pathOrUrl: string) => {
    const next = new URL(parent.url.href, location.href)
    next.searchParams.set(key, Paths.path(pathOrUrl))
    return parent.go(next)
  }, [key, parent])

  return useMemo(() => {
    return { url, go } satisfies PathHandle
  }, [url, go])
}

export function usePathState<T extends Record<string, Optional<string>>>() {
  const path = usePathContext().unwrap()

  const current = useMemo(() => {
    return Object.fromEntries(path.url.searchParams) as T
  }, [path])

  const [pending, setPending] = useState<T>(current)

  /**
   * Immediatly update the pending state when the current state changes
   */
  useMemo(() => {
    setPending(current)
  }, [current])

  /**
   * Lazily update the current state when the pending state differs
   */
  useEffect(() => {
    if (pending === current)
      return

    const url = new URL(path.url.href)
    const entries = Object.entries(pending).filter(([_, value]) => value != null)
    url.search = new URLSearchParams(entries as any).toString()

    if (path.url.href === url.href)
      return

    location.replace(path.go(url))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  return [current, setPending] as const
}

export function useKeyValueState<T extends Record<string, Optional<string>>>(key: keyof T, $parent: State<T>) {
  const [parent, setParent] = $parent

  const state = parent[key]

  const setState = useCallback((value: T[typeof key]) => {
    setParent(p => ({ ...p, [key]: value }))
  }, [setParent, key])

  return [state, setState] as const
}
