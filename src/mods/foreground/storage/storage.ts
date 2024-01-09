
import { AnyReactQuery } from "@/libs/glacier/hooks"
import { useEffect } from "react"

export interface Subscribable {
  subscribeOrThrow(cacheKey: string): Promise<void>
}

export function useSubscribe<K, D, F>(query: AnyReactQuery<K, D, F>, storage: Subscribable) {
  const { cacheKey } = query

  useEffect(() => {
    if (cacheKey == null)
      return
    storage.subscribeOrThrow(cacheKey).catch(console.warn)
  }, [cacheKey, storage])
}
