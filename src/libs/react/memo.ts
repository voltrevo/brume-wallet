import { DependencyList, useEffect, useMemo, useState } from "react"
import { States } from "./state"

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
      .catch(States.error(setState))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}