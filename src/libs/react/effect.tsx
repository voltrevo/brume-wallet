import { DependencyList, EffectCallback, useEffect, useRef } from "react";

export function useEffectButOnlyFirstTime(
  callback: EffectCallback,
  deps: DependencyList
) {
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return callback()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export function useEffectButNotFirstTime(
  callback: EffectCallback,
  deps: DependencyList
) {
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }

    return callback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}