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

export class ElementsGuard<T extends Guard<string, any>> {

  constructor(
    readonly guard: Guard<Guard.Input<T>, Guard.Output<T>>
  ) { }

  asOrThrow(value: Guard.Input<T>[]): Guard.Output<T>[] {
    return value.map(x => this.guard.asOrThrow(x))
  }

}

export class ArrayAndElementsGuard<T extends Guard<any, any>> {

  constructor(
    readonly guard: Guard<Guard.Input<T>, Guard.Output<T>>
  ) { }

  asOrThrow(value: unknown): Guard.Output<T>[] {
    if (!Array.isArray(value))
      throw new Error()
    return value.map(x => this.guard.asOrThrow(x))
  }

}

export class TupleGuard<T extends readonly Guard<any, any>[]> {

  constructor(
    readonly guards: { [K in keyof T]: Guard<Guard.Input<T[K]>, Guard.Output<T[K]>> }
  ) { }

  asOrThrow(value: { [K in keyof T]: Guard.Input<T[K]> }): { [K in keyof T]: Guard.Output<T[K]> } {
    if (value.length !== this.guards.length)
      throw new Error()
    return value.map((x, i) => this.guards[i].asOrThrow(x)) as any
  }

}