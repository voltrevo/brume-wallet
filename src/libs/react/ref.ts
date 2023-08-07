import { Mutex } from "@hazae41/mutex"
import { RefObject, SetStateAction, useCallback, useRef, useState } from "react"
import { Setter, useImmutableState } from "./state"

export function useConstant<T>(factory: () => T) {
  const ref = useRef<T>()

  if (ref.current == null)
    ref.current = factory()

  return ref.current
}

export type MutexRef<T> = Mutex<{ current: T }>

export function useMutexRef<T>(current: T) {
  return useImmutableState(() => new Mutex({ current }))
}

export type RefState<T> = [RefObject<T>, Setter<T>]

export function useRefState<T>(init?: T): RefState<T | undefined>;

export function useRefState<T>(init: T): RefState<T> {
  const ref = useRef(init)

  const [, setCounter] = useState(0)

  const setter = useCallback((action: SetStateAction<T>) => {
    const result = action instanceof Function
      ? action(ref.current)
      : action
    ref.current = result
    setCounter(x => x + 1)
  }, [])

  return [ref, setter]
}
