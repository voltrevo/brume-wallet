import { DependencyList, useCallback, useState } from "react"
import { useRefState } from "./ref"

export function useAsyncCallback<A extends unknown[], R>(
  callback: (...args: A) => Promise<R>,
  deps: DependencyList,
) {
  const [, setState] = useState<unknown>()

  return useCallback(async (...args: A) => {
    const promise = callback(...args)

    promise.catch(e => setState(() => { throw e }))

    return promise
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export function useAsyncUniqueCallback<A extends unknown[], R>(
  callback: (...args: A) => Promise<R>,
  deps: DependencyList
) {
  const [promiseRef, setPromise] = useRefState<Promise<R>>()

  const run = useCallback(async (...args: A) => {
    if (promiseRef.current) return

    const promise = callback(...args)

    promise
      .catch(e => setPromise(() => { throw e }))
      .finally(() => setPromise(undefined))

    setPromise(promise)
    return promise
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const promise = promiseRef.current
  const loading = Boolean(promise)

  return { run, promise, loading }
}