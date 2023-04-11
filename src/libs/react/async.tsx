import { DependencyList, useCallback } from "react"
import { useRefState } from "./ref"

export function useAsyncCallback<A extends unknown[], R>(
  subcallback: (...args: A) => Promise<R>,
  deps: DependencyList,
  onerror: (e: any) => void = console.error
) {
  return useCallback(async (...args: A) => {
    const promise = subcallback(...args)

    promise.catch(onerror)

    return promise
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, onerror])
}

export function useAsyncUniqueCallback<A extends unknown[], R>(
  subcallback: (...args: A) => Promise<R>,
  deps: DependencyList,
  onerror: (e: any) => void = console.error
) {
  const [promise, setPromise] = useRefState<Promise<R>>()

  const run = useCallback(async (...args: A) => {
    if (promise.current) return

    const nextPromise = subcallback(...args)

    nextPromise
      .catch(onerror)
      .finally(() => setPromise(undefined))

    setPromise(nextPromise)
    return nextPromise
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, onerror])

  const loading = Boolean(promise.current)

  return { run, promise, loading }
}