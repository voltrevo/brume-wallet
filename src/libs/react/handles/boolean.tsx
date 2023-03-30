import { useCallback, useState } from "react"
import { useObjectMemo } from "../memo"
import { State } from "../state"

export interface BooleanHandle {
  current: boolean

  set(x: boolean): void

  enable(): void
  disable(): void
  toggle(): void
}

export function useBoolean(state: State<boolean>) {
  const [current, set] = state

  const enable = useCallback(() => set(true), [set])
  const disable = useCallback(() => set(false), [set])
  const toggle = useCallback(() => set(x => !x), [set])

  return useObjectMemo({ current, set, enable, disable, toggle })
}

export function useBooleanState(init = false): BooleanHandle {
  return useBoolean(useState(init))
}