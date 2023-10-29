import { useState } from "react"
import { useObjectMemo } from "../memo"

export interface Handle<T> {
  readonly current: T
  set(next: T): void
}

export function useHandle<T>(init: T) {
  const [current, set] = useState<T>(init)
  return useObjectMemo({ current, set })
}