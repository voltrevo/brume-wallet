import { DependencyList, useEffect, useMemo, useState } from "react"
import { useRefState } from "./ref"

export function useObjectMemo<T extends {}>(object: T) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => object, Object.values(object))
}

export function useLazyMemo<T>(factory: () => T, deps: DependencyList) {
  const [state, setState] = useState<T>()

  useEffect(() => {
    setState(factory())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

export function useAsyncMemo<T>(factory: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<T>()

  useEffect(() => {
    factory()
      .then(setState)
      .catch(e => setState(() => { throw e }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

export function useAsyncUniqueMemo<T>(factory: () => Promise<T>, deps: DependencyList) {
  const [promiseRef, setPromise] = useRefState<Promise<T>>()
  const [current, setState] = useState<T>()

  useEffect(() => {
    if (promiseRef.current) return

    const promise = factory()

    promise
      .then(setState)
      .catch(e => setPromise(() => { throw e }))
      .finally(() => setPromise(undefined))

    setPromise(promise)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const promise = promiseRef.current
  const loading = Boolean(promise)

  return { current, promise, loading }
}