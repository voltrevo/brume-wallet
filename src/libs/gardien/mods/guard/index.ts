import { Super } from "../super"

export interface Guard<I, O> {
  asOrThrow(value: I): O
}

export namespace Guard {

  export interface Overloaded<W, S, O> {
    asOrThrow(value: S): O
    asOrThrow(value: W): O
  }

  export namespace Overloaded {
    export type Reject<T> = T extends Overloaded<any, any, any> ? never : T

    export type Weak<T> = T extends Overloaded<infer W, any, any> ? W : never

    export type Strong<T> = T extends Overloaded<any, infer S, any> ? S : never

    export type Output<T> = T extends Overloaded<any, any, infer O> ? O : never

    export type AllReject<T> = T extends readonly Overloaded<any, any, any>[] ? never : T

    export type AllStrong<T> = { [K in keyof T]: Strong<T[K]> }

    export type AllWeak<T> = { [K in keyof T]: Weak<T[K]> }

    export type AllOutput<T> = { [K in keyof T]: Output<T[K]> }
  }

  export interface Casted<W, S extends O, O> {
    asOrThrow(value: S): S
    asOrThrow(value: W): O
  }

  export namespace Casted {
    export type Reject<T> = T extends Casted<any, any, any> ? never : T

    export type Weak<T> = T extends Casted<infer W, any, any> ? W : never

    export type Strong<T> = T extends Casted<any, infer S, any> ? S : never

    export type Output<T> = T extends Casted<any, any, infer O> ? O : never

    export type AllReject<T> = T extends readonly Casted<any, any, any>[] ? never : T

    export type AllStrong<T> = { [K in keyof T]: Strong<T[K]> }

    export type AllWeak<T> = { [K in keyof T]: Weak<T[K]> }

    export type AllOutput<T> = { [K in keyof T]: Output<T[K]> }
  }

  export type Infer<T> = Guard<Guard.Input<T>, Guard.Output<T>>

  export type Reject<T> = T extends Guard<any, any> ? never : T

  export type Input<T> = T extends Guard<infer X, any> ? X : never

  export type Output<T> = T extends Guard<any, infer X> ? X : never

  export type AllInfer<T> = { [K in keyof T]: Infer<T[K]> }

  export type AllInput<T> = { [K in keyof T]: Input<T[K]> }

  export type AllOutput<T> = { [K in keyof T]: Output<T[K]> }

  export function asOrNull<T extends Guard.Casted<any, any, any>, X extends Guard.Casted.Strong<T>>(guard: T, value: X): X | null;

  export function asOrNull<T extends Guard.Casted<any, any, any>, X extends Guard.Casted.Weak<T>>(guard: T, value: Super<Infer<X>, Guard.Casted.Strong<T>>): Guard.Casted.Output<T> | null;

  export function asOrNull<T extends Guard.Overloaded<any, any, any>, X extends Guard.Overloaded.Strong<T>>(guard: Guard.Casted.Reject<T>, value: X): Guard.Overloaded.Output<T> | null;

  export function asOrNull<T extends Guard.Overloaded<any, any, any>, X extends Guard.Overloaded.Weak<T>>(guard: Guard.Casted.Reject<T>, value: Super<Infer<X>, Guard.Overloaded.Strong<T>>): Guard.Overloaded.Output<T> | null;

  export function asOrNull<T extends Guard<any, any>>(guard: Guard.Overloaded.Reject<T>, value: Guard.Input<T>): Guard.Output<T> | null;

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