import { Guard } from "../../guard"
import { Infer, Super } from "../../super"

export class ArrayGuard {

  constructor() { }

  static asOrThrow<X extends readonly unknown[]>(value: X): X

  static asOrThrow<X>(value: Super<Infer<X>, readonly unknown[]>): unknown[];

  static asOrThrow(value: unknown): unknown[] {
    if (!Array.isArray(value))
      throw new Error()
    return value
  }

  asOrThrow<X extends readonly unknown[]>(value: X): X

  asOrThrow<X>(value: Super<Infer<X>, readonly unknown[]>): unknown[]

  asOrThrow(value: unknown): unknown[] {
    if (!Array.isArray(value))
      throw new Error()
    return value
  }

}

export class ElementsGuard<T extends Guard<any, any>> {

  constructor(
    readonly guard: T
  ) { }

  asOrThrow<T extends Guard.Casted<any, any, any>, X extends readonly Guard.Casted.Strong<T>[]>(this: ElementsGuard<T>, value: X): X

  asOrThrow<T extends Guard.Casted<any, any, any>, X extends readonly Guard.Casted.Weak<T>[]>(this: ElementsGuard<T>, value: Super<Infer<X>, Guard.Casted.Strong<T>[]>): Guard.Casted.Output<T>[]

  asOrThrow<T extends Guard.Overloaded<any, any, any>, X extends readonly Guard.Overloaded.Strong<T>[]>(this: ElementsGuard<Exclude<T, Guard.Casted<any, any, any>>>, value: X): Guard.Overloaded.Output<T>[]

  asOrThrow<T extends Guard.Overloaded<any, any, any>, X extends readonly Guard.Overloaded.Weak<T>[]>(this: ElementsGuard<Exclude<T, Guard.Casted<any, any, any>>>, value: Super<Infer<X>, Guard.Overloaded.Strong<T>[]>): Guard.Overloaded.Output<T>[]

  asOrThrow<T extends Guard<any, any>>(this: ElementsGuard<Exclude<T, Guard.Overloaded<any, any, any>>>, value: Guard.Input<T>[]): Guard.Output<T>[]

  asOrThrow(this: ElementsGuard<Guard.Infer<T>>, value: Guard.Input<T>[]): Guard.Output<T>[] {
    return value.map(x => this.guard.asOrThrow(x))
  }

}

export class ArrayAndElementsGuard<T extends Guard<any, any>> {

  constructor(
    readonly guard: T
  ) { }

  asOrThrow<T extends Guard.Casted<any, any, any>, X extends readonly Guard.Casted.Strong<T>[]>(this: ArrayAndElementsGuard<T>, value: X): X

  asOrThrow<T extends Guard.Casted<any, any, any>, X>(this: ArrayAndElementsGuard<T>, value: Super<Infer<X>, Guard.Casted.Strong<T>[]>): Guard.Casted.Output<T>[]

  asOrThrow<T extends Guard.Overloaded<any, any, any>, X extends readonly Guard.Overloaded.Strong<T>[]>(this: ArrayAndElementsGuard<Exclude<T, Guard.Casted<any, any, any>>>, value: X): Guard.Overloaded.Output<T>[]

  asOrThrow<T extends Guard.Overloaded<any, any, any>, X>(this: ArrayAndElementsGuard<Exclude<T, Guard.Casted<any, any, any>>>, value: Super<Infer<X>, Guard.Overloaded.Strong<T>[]>): Guard.Overloaded.Output<T>[]

  asOrThrow<T extends Guard<any, any>>(this: ArrayAndElementsGuard<Exclude<T, Guard.Overloaded<any, any, any>>>, value: unknown): Guard.Output<T>[]

  asOrThrow(this: ArrayAndElementsGuard<Guard.Infer<T>>, value: unknown): Guard.Output<T>[] {
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
  asOrThrow<T extends readonly Guard.Casted<any, any, any>[], X extends Guard.Casted.AllStrong<T>>(this: TupleGuard<T>, value: X): X

  // @ts-ignore
  asOrThrow<T extends readonly Guard.Casted<any, any, any>[], X extends Guard.Casted.AllWeak<T>>(this: TupleGuard<T>, value: Super<Infer<X>, Guard.Casted.AllStrong<T>>): Guard.Casted.AllOutput<T>

  // @ts-ignore
  asOrThrow<T extends readonly Guard.Overloaded<any, any, any>[], X extends Guard.Overloaded.AllStrong<T>>(this: TupleGuard<Exclude<T, readonly Guard.Casted<any, any, any>[]>>, value: X): Guard.Overloaded.AllOutput<T>

  // @ts-ignore
  asOrThrow<T extends readonly Guard.Overloaded<any, any, any>[], X extends Guard.Overloaded.AllWeak<T>>(this: TupleGuard<Exclude<T, readonly Guard.Casted<any, any, any>[]>>, value: Super<Infer<X>, Guard.Overloaded.AllStrong<T>>): Guard.Overloaded.AllOutput<T>

  // @ts-ignore
  asOrThrow<T extends readonly Guard<any, any>[]>(this: TupleGuard<Exclude<T, readonly Guard.Overloaded<any, any, any>[]>>, value: Guard.AllInput<T>): Guard.AllOutput<T>

  asOrThrow(this: TupleGuard<Guard.AllInfer<T>>, value: Guard.AllInput<T>): Guard.AllOutput<T> {
    if (value.length !== this.guards.length)
      throw new Error()
    return value.map((x, i) => this.guards[i].asOrThrow(x)) as any
  }

}