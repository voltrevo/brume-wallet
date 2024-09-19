import { ArrayGuard } from "../guards"
import { Super } from "../super"

export interface Guard<I, O> {
  asOrThrow<X>(value: Super<X, I>): O
}

export namespace Guard {

  export interface Strict<I, O> {
    asOrThrow: <X>(value: Super<X, I>) => O
  }

  export interface Casted<I, O> extends Guard<I, O> {
    asOrThrow<X extends O>(value: X): X
    asOrThrow<X>(value: Super<X, I>): O
  }

  export namespace Casted {
    export type Reject<T> = T extends Casted<any, any> ? never : T

    export type Input<T> = T extends Casted<infer X, any> ? X : never

    export type Output<T> = T extends Casted<any, infer X> ? X : never
  }

  export type Reject<T> = T extends Guard<any, any> ? never : T

  export type Input<T> = T extends Guard<infer X, any> ? X : never

  export type Output<T> = T extends Guard<any, infer X> ? X : never

  export type AllInput<T> = { [K in keyof T]: Input<T[K]> }

  export type AllOutput<T> = { [K in keyof T]: Output<T[K]> }

  export function asOrNull<T extends Guard.Casted<any, any>, X extends Guard.Casted.Input<T>>(guard: T, value: X): (X & Guard.Casted.Output<T>) | null;

  export function asOrNull<T extends Guard<any, any>, X>(guard: Guard.Casted.Reject<T>, value: Super<X, Guard.Input<T>>): Guard.Output<T> | null;

  export function asOrNull<T extends Guard<any, any>>(guard: T, value: Guard.Input<T>): Guard.Output<T> | null {
    try {
      return guard.asOrThrow(value)
    } catch {
      return null
    }
  }

  // export function is<T extends Guard<unknown, unknown>, X>(guard: T, value: Coerced.Input<T["asOrThrow"], X, Guard.Input<T>, Guard.Output<T>>): value is Coerced.Input<T["asOrThrow"], X, Guard.Input<T>, Guard.Output<T>> & Guard.Output<T> {
  //   try {
  //     guard.asOrThrow(value as Guard.Input<T>)

  //     return true
  //   } catch {
  //     return false
  //   }
  // }

}

const x = Guard.asOrNull(ArrayGuard, [1, 2, 3] as const) 