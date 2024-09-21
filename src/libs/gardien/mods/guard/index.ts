import { Resolve, Strongest, Super } from "../super"

export interface Guard<I, O> {
  asOrThrow(value: I): O
}

export namespace Guard {

  export interface Overloaded<W, S extends W, O> {
    asOrThrow(value: S): O
    asOrThrow(value: W): O
  }

  export namespace Overloaded {
    export type Infer<T> = Overloaded<Weak<T>, Strong<T>, Output<T>>

    export type Weak<T> = T extends Overloaded<infer W, any, any> ? W : never

    export type Strong<T> = T extends Overloaded<any, infer S, any> ? S : never

    export type Output<T> = T extends Overloaded<any, any, infer O> ? O : never

    export type AllStrong<T> = { [K in keyof T]: Strong<T[K]> }

    export type AllWeak<T> = { [K in keyof T]: Weak<T[K]> }

    export type AllOutput<T> = { [K in keyof T]: Output<T[K]> }

    export type AllAsOutput<T, X> = { [K in keyof X]: Output<T> }

  }

  export interface Casted<W, S extends W> {
    is(value: S): value is S
    is(value: W): value is S

    asOrThrow(value: S): S
    asOrThrow(value: W): S
  }

  export namespace Casted {
    export type Infer<T> = Casted<Weak<T>, Strong<T>>

    export type Weak<T> = T extends Casted<infer W, any> ? W : never

    export type WeakOrSelf<T> = T extends Casted<infer W, any> ? W : T

    export type Strong<T> = T extends Casted<any, infer S> ? S : never

    export type AllAsStrong<T, X> = { [K in keyof X]: Strong<T> }

    export type StrongOrSelf<T> = T extends Casted<any, infer S> ? S : T

    export type AllStrong<T> = { [K in keyof T]: Strong<T[K]> }

    export type AllStrongOrSelf<T> = { [K in keyof T]: StrongOrSelf<T[K]> }

    export type AllWeak<T> = { [K in keyof T]: Weak<T[K]> }

    export type AllWeakOrSelf<T> = { [K in keyof T]: WeakOrSelf<T[K]> }
  }

  export type Infer<T> = Guard<Guard.Input<T>, Guard.Output<T>>

  export type Input<T> = T extends Guard<infer X, any> ? X : never

  export type InputOrSelf<T> = T extends Guard<infer X, any> ? X : T

  export type Output<T> = T extends Guard<any, infer X> ? X : never

  export type OutputOrSelf<T> = T extends Guard<any, infer X> ? X : T

  export type AllInfer<T> = { [K in keyof T]: Infer<T[K]> }

  export type AllInput<T> = { [K in keyof T]: Input<T[K]> }

  export type AllInputOrSelf<T> = { [K in keyof T]: InputOrSelf<T[K]> }

  export type AllOutput<T> = { [K in keyof T]: Output<T[K]> }

  export type AllOutputOrSelf<T> = { [K in keyof T]: OutputOrSelf<T[K]> }

  export function asOrNull<T extends Guard<any, any>, X extends Guard.Overloaded.Strong<T>>(guard: T, value: X): Guard.Overloaded.Output<T> | null;

  export function asOrNull<T extends Guard<any, any>, X extends Guard.Overloaded.Weak<T>>(guard: T, value: Super<Resolve<X>, Strongest<X, Guard.Overloaded.Strong<T>>>): Guard.Overloaded.Output<T> | null;

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