import { Query } from "@hazae41/glacier"
import { Result } from "@hazae41/result"
import { useEffect } from "react"

export interface Subscribable {
  trySubscribe(cacheKey: string): Promise<Result<void, Error>>
}

export function useSubscribe<K, D, F>(query: Query<K, D, F>, storage: Subscribable) {
  const { cacheKey } = query

  useEffect(() => {
    if (cacheKey == null)
      return
    storage.trySubscribe(cacheKey).then(r => r.inspectErrSync(console.warn))
  }, [cacheKey, storage])
}
