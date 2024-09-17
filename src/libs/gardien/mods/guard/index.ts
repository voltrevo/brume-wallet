import { Coerce } from "../coerce"

export interface Guard<I, O> {
  asOrThrow<X>(value: Coerce<X, I, O>): O
}

export namespace Guard {

  export interface Strict<I, O> {
    asOrThrow: <X>(value: Coerce<X, I, O>) => O
  }

  export type Infer<T extends Guard<unknown, unknown>> = Guard<Input<T>, Output<T>>

  export type Input<T> = T extends Guard<infer I, unknown> ? I : never

  export type Output<T> = T extends Guard<unknown, infer O> ? O : never

  export type AllInput<T> = { [K in keyof T]: Input<T[K]> }

  export type AllOutput<T> = { [K in keyof T]: Output<T[K]> }

  export function asOrNull<T extends Guard.Infer<T>, X>(guard: T, value: Coerce<X, Guard.Input<T>, Guard.Output<T>>): X & Guard.Output<T> | null {
    try {
      return guard.asOrThrow(value) as X & Guard.Output<T>
    } catch {
      return null
    }
  }

  export function is<T extends Guard.Infer<T>, X>(guard: T, value: Coerce<X, Guard.Input<T>, Guard.Output<T>>): value is X & Guard.Output<T> {
    try {
      guard.asOrThrow(value)

      return true
    } catch {
      return false
    }
  }

}