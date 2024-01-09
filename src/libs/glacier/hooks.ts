import { ReactQuery } from "@hazae41/glacier";
import { useEffect } from "react";

export type AnyReactQuery<K, D, F> =
  | ReactQuery<K, D, F>
  | ReactQuery<K, D, never>

/**
 * Do a request on interval until data is available
 * @see useRetry for error retry
 * @param query 
 * @param interval 
 */
export function useWait<K, D, F>(query: ReactQuery<K, D, F>, interval: number) {
  const { fetcher, ready, data, fetch } = query

  useEffect(() => {
    if (!ready)
      return
    if (fetcher == null)
      return
    if (!interval)
      return
    if (data != null)
      return

    const f = () => fetch().catch(console.warn)
    const i = setInterval(f, interval)
    return () => clearInterval(i)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data, fetch, interval])
}