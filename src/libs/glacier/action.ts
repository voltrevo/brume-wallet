import { Simple, core } from "@hazae41/glacier"
import { None, Nullable } from "@hazae41/option"
import { DependencyList, useCallback, useEffect, useMemo, useRef, useState } from "react"

export type Action<K, D, P> =
  (key: K, params: P) => Promise<D>

export function useAction<K, D, P extends []>(
  key: K,
  action: Action<K, D, P>,
  deps: DependencyList
) {
  const cacheKey = useMemo(() => {
    return Simple.getCacheKey(key)
  }, [key])

  const [, setCounter] = useState(0)

  const aborterRef = useRef<Nullable<AbortController>>()

  useMemo(() => {
    aborterRef.current = core.getAborterSync(cacheKey)
  }, [cacheKey])

  const setAborter = useCallback((aborter: Nullable<AbortController>) => {
    aborterRef.current = aborter
    setCounter(c => c + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  useEffect(() => {
    const onAborter = () => {
      setAborter(core.getAborterSync(cacheKey))
      return new None()
    }

    return core.onAborter.on(cacheKey, onAborter, { passive: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  const run = useCallback(async (...params: P) => {
    return await core.runOrJoin(cacheKey, new AbortController(), () => action(key, params))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...deps])

  const rerun = useCallback(async (...params: P) => {
    return await core.runOrReplace(cacheKey, new AbortController(), () => action(key, params))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...deps])

  const aborter = aborterRef.current
  const loading = aborter != null

  return {
    key,
    cacheKey,
    aborter,
    loading,
    run,
    rerun
  }
} 