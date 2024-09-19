import { ArrayGuard } from "../guards"

export interface Guard<I, O> {
  asOrThrow(value: I): O
}

export namespace Guard {

  export interface Strict<I, O> {
    asOrThrow: (value: I) => O
  }

  export interface Coerced<W, S, O> extends Guard<S, O> {
    asOrThrow(value: S): O
    asOrThrow<X>(value: Strict<X, W>): O
  }

  export namespace Coerced {
    export type Reject<T> = T extends Coerced<any, any, any> ? never : T

    export type Weak<T> = T extends Coerced<infer W, any, any> ? W : never

    export type Strong<T> = T extends Coerced<any, infer S, any> ? S : never

    export type Output<T> = T extends Coerced<any, any, infer O> ? O : never
  }

  export interface Casted<I, O> extends Coerced<I, O, O> {
    asOrThrow<X extends O>(value: X): X

    asOrThrow(value: O): O

    asOrThrow<X>(value: Strict<X, I>): O
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

  export function asOrNull<T extends Guard.Coerced<any, any, any>, X>(guard: T, value: Guard.Coerced.Strong<T>): Guard.Coerced.Output<T> | null;

  export function asOrNull<T extends Guard.Coerced<any, any, any>, X>(guard: T, value: Strict<X, Guard.Coerced.Weak<T>>): Guard.Coerced.Output<T> | null;

  export function asOrNull<T extends Guard<any, any>>(guard: Guard.Coerced.Reject<T>, value: Guard.Input<T>): Guard.Output<T> | null;

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