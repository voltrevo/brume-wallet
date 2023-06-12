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
    const result = await Result.catchAndWrap(factory)

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
  const aborterRef = useRef<AbortController>()

  const run = useCallback(async () => {
    const aborter = new AbortController()

    aborterRef.current?.abort()
    aborterRef.current = aborter

    const result = await Result.catchAndWrap(factory)

    if (aborterRef.current === aborter) {
      aborterRef.current = undefined
      setState(() => result.unwrap())
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    Promises.fork().then(run)
  }, [run])

  return state
}