import { Optional } from "@hazae41/option"
import { useCallback, useState } from "react"
import { useObjectMemo } from "../memo"
import { State } from "../state"

export interface Handle<T> {
  readonly current: T
  set(next: T): void
}

export function useHandleState<T>(state: State<T>): Handle<T> {
  const [current, set] = state
  return useObjectMemo({ current, set })
}

export function useHandle<T>(init: T) {
  return useHandleState<T>(useState<T>(init))
}

export interface OptionalHandle<T> {
  current?: T
  set(next?: T): void
  unset(): void
}

export function useOptional<T>(init?: T) {
  const [current, set] = useState<Optional<T>>(init)

  const unset = useCallback(() => set(undefined), [set])

  return useObjectMemo({ current, set, unset })
}