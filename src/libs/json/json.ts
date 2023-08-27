
export type Class<T> = new (...params: any[]) => T

export interface Guardable<I, O> {
  is(value: I): value is I & O
}

export namespace Guardable {

  export type Infer<T extends Guardable<unknown, unknown>> = Guardable<Input<T>, Output<T>>

  export type Input<T> = T extends Guardable<infer I, unknown> ? I : never

  export type Output<T> = T extends Guardable<unknown, infer O> ? O : never

}

export class Guard<I, O> {

  constructor(
    readonly inner: Guardable<I, O>
  ) { }

  /**
   * Create a new Guard from a Guardable
   * @param guardable 
   * @returns 
   */
  static from<T extends Guardable.Infer<T>>(guardable: T) {
    return new Guard(guardable)
  }

  /**
   * Guard value
   * @param value 
   * @returns 
   */
  is(value: I): value is I & O {
    return this.inner.is(value)
  }

  /**
   * Unconditional intersection (A & B)
   * @param other 
   * @returns 
   */
  inter<T>(other: Guardable<I, T>) {
    return new Guard(new InterGuard<I, O, T>(this, other))
  }

  /**
   * Unconditional union (A | B)
   * @param other String.union(Boolean) -> string | boolean
   * @returns 
   */
  union<T>(other: Guardable<I, T>) {
    return new Guard(new UnionGuard<I, O, T>(this, other))
  }

  /**
   * Conditional union (A & B knowing A)
   * @example String.then(ZeroHexString) -> `0x${string}`
   * @example String.then(EmailString) -> `${string}@${string}.${string}`
   * @param other 
   * @returns 
   */
  then<T>(other: Guardable<O, T>) {
    return new Guard(new ThenGuard<I, O, T>(this, other))
  }

}

/**
 * Guards that any value is an array
 */
export namespace ArrayGuard {

  export function is(value: unknown): value is any[] {
    return Array.isArray(value)
  }

}

/**
 * Guards all the elements of an array value
 */
export class ElementsGuard<T extends Guardable.Infer<T>> {

  constructor(
    readonly guardable: T
  ) { }

  is(value: Guardable.Input<T>[]): value is any[] & Guardable.Output<T>[] {
    return value.every(x => this.guardable.is(x))
  }

}

export class HasPropertyGuard<I, P> {

  constructor(
    readonly property: P
  ) { }

  is(value: unknown) {

  }
}

// export class TupleGuard<I extends any[], O extends readonly any[]> extends Guard<I, O> {

//   constructor(
//     readonly tuple: readonly Guardable<I[]>[]
//   ) { }
// }

export class ThenGuard<I, X, O> implements Guardable<I, O> {

  constructor(
    readonly a: Guardable<I, X>,
    readonly b: Guardable<X, O>
  ) { }

  is(value: I): value is I & O {
    return this.a.is(value) && this.b.is(value)
  }

}

export class InterGuard<I, A, B> implements Guardable<I, A & B> {

  constructor(
    readonly a: Guardable<I, A>,
    readonly b: Guardable<I, B>
  ) { }

  is(value: I): value is I & (A & B) {
    return this.a.is(value) && this.b.is(value)
  }

}

export class UnionGuard<I, A, B> implements Guardable<I, A | B> {

  constructor(
    readonly a: Guardable<I, A>,
    readonly b: Guardable<I, B>
  ) { }

  is(value: I): value is I & (A | B) {
    return this.a.is(value) || this.b.is(value)
  }

}

export namespace BooleanGuard {

  export function is(value: unknown): value is boolean {
    return typeof value === "boolean"
  }

}

export namespace StringGuard {

  export function is(value: unknown): value is string {
    return typeof value === "string"
  }

}

export namespace ZeroHexStringGuard {

  export function is(value: string): value is `0x${string}` {
    return value.startsWith("0x")
  }

}

export namespace Unguard {

  export function is<T>(value: T): value is T {
    return true
  }

}

function test(x: unknown) {
  if (Guard.from(StringGuard).then(ZeroHexStringGuard).is(x))
    x
  if (Guard.from(ArrayGuard).then(new ElementsGuard(StringGuard)).is(x))
    x
}

// export class Json<T> {

//   /**
//    * Abstraction containing a schema and a text
//    * @param schema 
//    * @param inner 
//    */
//   constructor(
//     readonly schema: Guard<T>,
//     readonly inner: string
//   ) { }

//   from(schema: Guard<T>, value: T) {

//   }

//   tryParse() {
//     return this.schema.tryParse(JSON.parse(this.inner))
//   }

// }

// const zbool = new Schema(z.boolean())
// const json = new Json<boolean>(, "true")

// function test(json: Json<string>) {
//   const value = json.tryParse()
// }