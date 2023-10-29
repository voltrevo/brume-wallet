import { Nullable } from "@hazae41/option"
import { useCallback, useState } from "react"
import { useObjectMemo } from "../memo"

export interface NullableHandle<T> {
  readonly current: Nullable<T>
  set(next: Nullable<T>): void
  unset(): void
}

export function useNullableHandle<T>(init?: T) {
  const [current, set] = useState<Nullable<T>>(init)
  const unset = useCallback(() => set(undefined), [set])
  return useObjectMemo({ current, set, unset })
}