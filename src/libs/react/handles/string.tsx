import { useCallback, useState } from "react"
import { useObjectMemo } from "../memo"
import { State } from "../state"

export interface OptionalStringHandle {
  current?: string
  set(value?: string): void
  unset(): void
}

export function useOptionalString(state: State<string | undefined>): OptionalStringHandle {
  const [current, set] = state

  const unset = useCallback(() => set(undefined), [set])

  return useObjectMemo({ current, set, unset })
}

export function useOptionalStringState(init?: string) {
  return useOptionalString(useState(init))
}