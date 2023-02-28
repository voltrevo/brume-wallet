import { Dispatch, SetStateAction } from "react";

export type State<T> = [T, Setter<T>]

export type Setter<T> = Dispatch<SetStateAction<T>>

export namespace States {

  export function error<T>(setter: Setter<T>) {
    return (e: unknown) => setter(() => { throw e })
  }

}