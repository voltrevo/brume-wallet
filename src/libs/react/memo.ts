import { Result } from "@hazae41/result"
import { DependencyList, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Promises } from "../promises/promises"

export function useObjectMemo<T extends {}>(object: T) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => object, Object.values(object))
}

export function useLazyMemo<T>(factory: () => T, deps: DependencyList) {
  const [state, setState] = useState<T>()

  useEffect(() => {
    setState(factory)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

export function useAsyncMemo<T>(factory: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<T>()

  const run = useCallback(async () => {
    await Promises.fork()

    const result = await Result.tryWrap(factory)
    setState(() => result.unwrap())

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    Promises.fork().then(run)
  }, [run])

  return state
}

export function useAsyncReplaceMemo<T>(factory: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<T>()

  const aborterRef = useRef<AbortController | null>(null)

  const run = useCallback(async () => {
    const aborter = new AbortController()

    aborterRef.current?.abort()
    aborterRef.current = aborter

    const result = await Result.tryWrap(factory)

    if (aborterRef.current === aborter) {
      aborterRef.current = null
      setState(() => result.unwrap())
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    Promises.fork().then(run)
  }, [run])

  return state
}