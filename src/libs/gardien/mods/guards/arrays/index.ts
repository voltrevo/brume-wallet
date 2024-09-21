import { Guard } from "../../guard"
import { Morph, Super } from "../../super"

export class ArrayGuard {

  constructor() { }

  static asOrThrow<X extends readonly unknown[]>(value: X): X

  static asOrThrow<X>(value: Super<X, Morph<X, readonly unknown[]>>): readonly unknown[]

  static asOrThrow(value: unknown): readonly unknown[] {
    if (!Array.isArray(value))
      throw new Error()
    return value
  }

  asOrThrow<X extends unknown[]>(value: X): X

  asOrThrow<X>(value: Super<X, Morph<X, readonly unknown[]>>): readonly unknown[]

  asOrThrow(value: unknown): readonly unknown[] {
    if (!Array.isArray(value))
      throw new Error()
    return value
  }

}

export class ElementsGuard<T extends Guard<any, any>> {

  constructor(
    readonly guard: T
  ) { }

  asOrThrow<X extends readonly Guard.Overloaded.Strong<T>[]>(value: X): X extends readonly Guard.Overloaded.Output<T>[] ? X : readonly Guard.Overloaded.Output<T>[]

  asOrThrow<X extends readonly Guard.Overloaded.Weak<T>[]>(value: Super<X, Morph<X, readonly Guard.Overloaded.Strong<T>[]>>): readonly Guard.Overloaded.Output<T>[]

  asOrThrow(this: ElementsGuard<Guard.Overloaded.Infer<T>>, value: readonly Guard.Overloaded.Weak<T>[]): readonly Guard.Overloaded.Output<T>[] {
    return value.map(x => this.guard.asOrThrow(x))
  }

}

export class ArrayAndElementsGuard<T extends Guard<unknown, any>> {

  constructor(
    readonly guard: T
  ) { }

  asOrThrow<X extends readonly Guard.Overloaded.Strong<T>[]>(value: X): X extends readonly Guard.Overloaded.Output<T>[] ? X : readonly Guard.Overloaded.Output<T>[]

  asOrThrow<X>(value: Super<X, Morph<X, readonly Guard.Overloaded.Strong<T>[]>>): readonly Guard.Overloaded.Output<T>[]

  asOrThrow(this: ArrayAndElementsGuard<Guard.Overloaded.Infer<T>>, value: unknown): Guard.Overloaded.Output<T>[] {
    if (!Array.isArray(value))
      throw new Error()
    return value.map(x => this.guard.asOrThrow(x))
  }

}

export class TupleGuard<T extends readonly Guard<any, any>[]> {

  constructor(
    readonly guards: T
  ) { }

  // @ts-ignore
  asOrThrow<T extends readonly Guard.Overloaded<any, any, any>[], X extends Guard.Overloaded.AllStrong<T>>(this: TupleGuard<Exclude<T, readonly Guard.Casted<any, any, any>[]>>, value: X): Guard.Overloaded.AllOutput<T>

  // @ts-ignore
  asOrThrow<T extends readonly Guard.Overloaded<any, any, any>[], X extends Guard.Overloaded.AllWeak<T>>(this: TupleGuard<Exclude<T, readonly Guard.Casted<any, any, any>[]>>, value: Super<X, Guard.Overloaded.AllStrong<T>>): Guard.Overloaded.AllOutput<T>

  // @ts-ignore
  asOrThrow<T extends readonly Guard<any, any>[]>(this: TupleGuard<Exclude<T, readonly Guard.Overloaded<any, any, any>[]>>, value: Guard.AllInput<T>): Guard.AllOutput<T>

  asOrThrow(this: TupleGuard<Guard.AllInfer<T>>, value: Guard.AllInput<T>): Guard.AllOutput<T> {
    if (value.length !== this.guards.length)
      throw new Error()
    return value.map((x, i) => this.guards[i].asOrThrow(x)) as any
  }

}