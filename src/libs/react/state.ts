import { Dispatch, SetStateAction, useState } from "react";

export type State<T> = readonly [T, Setter<T>]

export type Setter<T> = Dispatch<SetStateAction<T>>

export function useImmutableState<S>(initialState: S | (() => S)) {
  const [state] = useState(initialState)

  return state
}