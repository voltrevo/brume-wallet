
export interface Guardable<I, O> {
  is(value: I): value is I & O
}

export namespace Guardable {

  export type Infer<T extends Guardable<unknown, unknown>, I = unknown, O = unknown> = Guardable<Input<T> & I, Output<T> & O>

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
    // if (guardable instanceof Guard)
    // return guardable as Guard<Guardable>
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
  inter<X>(other: Guardable<I, X>) {
    return Guard.from(new InterGuard<I, O, X>(this, other))
  }

  /**
   * Unconditional union (A | B)
   * @param other String.union(Boolean) -> string | boolean
   * @returns 
   */
  union<X>(other: Guardable<I, X>) {
    return Guard.from(new UnionGuard<I, O, X>(this, other))
  }

  /**
   * Conditional union (A & B knowing A)
   * @example String.then(ZeroHexString) -> `0x${string}`
   * @example String.then(EmailString) -> `${string}@${string}.${string}`
   * @param other 
   * @returns 
   */
  then<X>(other: Guardable<O, X>) {
    return Guard.from(new ThenGuard<I, O, X>(this, other))
  }

  static boolean() {
    return Guard.from(BooleanGuard)
  }

  static string() {
    return Guard.from(StringGuard)
  }

  // static object<T extends { [property in PropertyKey]: Guardable<unknown, unknown> }>(schema: T): Guard<unknown, { [P in keyof T]: Guardable.Output<T[P]> }> {
  //   let guard = Guard.from(ObjectGuard)

  //   for (const [property, subguard] of Object.entries(schema))
  //     guard = guard.then(new HasPropertyGuard(property)).then(new PropertyGuard(property, subguard))

  //   return guard as Guard<any, any>
  // }

  static array() {

  }

}

export namespace Unguard {

  export function is<T>(value: T): value is T {
    return true
  }

}

export namespace ObjectGuard {

  export function is(value: unknown): value is object {
    return typeof value === "object"
  }

}

export namespace BooleanGuard {

  export function is(value: unknown): value is boolean {
    return typeof value === "boolean"
  }

}

export class MinLengthGuard<T extends { length: number }> {

  constructor(
    readonly length: number
  ) { }

  is(value: T): value is T {
    return value.length > this.length
  }

}

export class MaxLengthGuard<T extends { length: number }> {

  constructor(
    readonly length: number
  ) { }

  is(value: T): value is T {
    return value.length < this.length
  }

}

export class StringGuard<I, O extends string> {

  constructor(
    readonly subguard: Guardable<I, O>
  ) { }

  static from<T extends Guardable.Infer<T, unknown, string>>(guardable: T) {
    return new StringGuard(guardable)
  }

  static is(value: unknown): value is string {
    return typeof value === "string"
  }

  is(value: I): value is I & O {
    return this.subguard.is(value)
  }

  min(length: number) {
    return StringGuard.from(Guard.from(this.subguard).then<O>(new MinLengthGuard(length)))
  }

}

export class ZeroHexStringGuard<T extends string> {

  is(value: T): value is T & `0x${string}` {
    return value.startsWith("0x")
  }

}

const x = Guard.from(StringGuard).then(new ZeroHexStringGuard())
StringGuard.from(x).min(123)



/**
 * Guards that any value is an array
 */
export namespace ArrayGuard {

  export function is(value: unknown): value is unknown[] {
    return Array.isArray(value)
  }

}

/**
 * Guards all the elements of an array value
 */
export class ElementsGuard<T extends Guardable.Infer<T>> {

  constructor(
    readonly subguard: T
  ) { }

  is(value: Guardable.Input<T>[]): value is any[] & Guardable.Output<T>[] {
    return value.every(x => this.subguard.is(x))
  }

}

export class HasPropertyGuard<P extends PropertyKey> {

  constructor(
    readonly property: P
  ) { }

  is(value: object): value is { [property in P]: unknown } {
    return this.property in value
  }

}

export class PropertyGuard<P extends PropertyKey, O> {

  constructor(
    readonly property: P,
    readonly subguard: Guardable<unknown, O>
  ) { }

  is(value: { [property in P]: unknown }): value is { [property in P]: O } {
    return this.subguard.is(value[this.property])
  }

}

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

function test(x: unknown) {
  {
    if (Guard.object({}).is(x))
      x
  }
  {
    if (Guard.from(ObjectGuard).then(new HasPropertyGuard("hello")).then(new PropertyGuard("hello", StringGuard)).is(x))
      x.hello
  }
  {
    if (Guard.from(StringGuard).then(ZeroHexStringGuard).is(x))
      x
  }
  {
    if (Guard.from(ArrayGuard).is(x))
      if (Guard.from(new ElementsGuard(StringGuard)).is(x))
        // if (Guard.from(ArrayGuard).then(new ElementsGuard(StringGuard)).is(x))
        x
  }
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