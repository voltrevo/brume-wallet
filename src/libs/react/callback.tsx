import { DependencyList, useCallback } from "react"
import { Errors } from "../errors/errors"
import { useRefState } from "./ref"

/**
 * Like useCallback() but it accepts a callback that won't run if already running
 * @param callback 
 * @param deps 
 * @returns 
 */
export function useAsyncUniqueCallback<A extends unknown[], R>(
  callback: (...args: A) => Promise<R>,
  deps: DependencyList
) {
  const [promiseRef, setPromise] = useRefState<Promise<R>>()

  const run = useCallback(async (...args: A) => {
    if (promiseRef.current) return

    const promise = callback(...args)

    promise
      .catch(Errors.logAndAlert)
      .finally(() => setPromise(undefined))

    setPromise(promise)
    return promise
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const promise = promiseRef.current
  const loading = Boolean(promise)

  return { run, promise, loading }
}