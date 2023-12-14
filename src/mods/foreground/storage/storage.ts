
import { ReactQuery } from "@hazae41/glacier"
import { useEffect } from "react"

export interface Subscribable {
  subscribeOrThrow(cacheKey: string): Promise<void>
}

export function useSubscribe<K, D, F>(query: ReactQuery<K, D, F>, storage: Subscribable) {
  const { cacheKey } = query

  useEffect(() => {
    if (cacheKey == null)
      return
    storage.subscribeOrThrow(cacheKey).catch(console.warn)
  }, [cacheKey, storage])
}
