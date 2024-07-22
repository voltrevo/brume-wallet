import { State } from "@/libs/react/state";
import { Optional } from "@hazae41/option";
import { useCallback } from "react";

export function useKeyValueState<T extends Record<string, Optional<string>>>(key: keyof T, $parent: State<T>) {
  const [parent, setParent] = $parent

  const state = parent[key]

  const setState = useCallback((value: T[typeof key]) => {
    setParent(p => ({ ...p, [key]: value }))
  }, [setParent, key])

  return [state, setState] as const
}
