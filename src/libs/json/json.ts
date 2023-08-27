import { Err, Ok, Result } from "@hazae41/result"

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
    return new Guard<Guardable.Input<T>, Guardable.Output<T>>(guardable)
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
   * Try to cast value
   * @param value 
   * @returns 
   */
  tryAs(value: I): Result<I & O, Error> {
    if (this.is(value))
      return new Ok(value)
    return new Err(new Error())
  }

  /**
   * Unconditional intersection (A & B)
   * @example Guard.from(new HasPropertyGuard("name")).inter(new HasPropertyGuard("age")) -> { name: unknown } & { age: unknown } -> { name: unknown, age: unknown }
   * @param other 
   * @returns 
   */
  inter<X>(other: Guardable<I, I & X>) {
    return new Guard<I, O & X>(new InterGuard<I, O, X>(this, other))
  }

  /**
   * Unconditional union (A | B)
   * @param other Guard.from(StringGuard).union(BooleanGuard) -> string | boolean
   * @returns 
   */
  union<X>(other: Guardable<I, I & X>) {
    return new Guard<I, O | X>(new UnionGuard<I, O, X>(this, other))
  }

  /**
   * Conditional intersection (A & B knowing A), used when `other` has O in input
   * @example Guard.from(StringGuard).then(ZeroHexStringGuard) -> `0x${string}`
   * @example Guard.from(StringGuard).then(EmailStringGuard) -> `${string}@${string}.${string}`
   * @example Guard.from(StringGuard).then(new MinLengthGuard(123)) -> string
   * @param other 
   * @returns 
   */
  then<X>(other: Guardable<O, O & X>) {
    return new Guard<I, O & X>(new ThenGuard<I, O, O & X>(this, other))
  }

  static boolean() {
    return Guard.from(BooleanGuard)
  }

  static string() {
    return Guard.from(StringGuard)
  }

  static min(length: number) {
    return Guard.from(new MinLengthGuard(length))
  }

  static max(length: number) {
    return Guard.from(new MaxLengthGuard(length))
  }

  static object<T extends { [property in PropertyKey]: Guardable<unknown, unknown> }>(schema: T): Guard<unknown, { [P in keyof T]: Guardable.Output<T[P]> }> {
    let guard = Guard.from(ObjectGuard)

    for (const [property, subguard] of Object.entries(schema))
      guard = guard.then(new HasPropertyGuard(property)).then(new PropertyGuard(property, subguard))

    return guard as Guard<any, any>
  }

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

  is(value: object): value is object & { [property in P]: unknown } {
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

const hex = Guard.from(StringGuard)
  .inter(ZeroHexStringGuard)
  .then(new MinLengthGuard(16))
  .then(new MaxLengthGuard(256))
  .tryAs(`0xdeadbeef4c6f72656d20697073756d20646f6c6f722073`)
  .unwrap()


const obj = Guard.from(ObjectGuard)
  .inter(new HasPropertyGuard("hello"))
  .inter(new HasPropertyGuard("world"))
  .tryAs({})

/**
 * Generic interface
 */
interface Runnable<A> {
  run(a: A): void
}

/**
 * Runnable<string> that should only accept strings
 */
class StringRunnable {
  run(a: string) { }
}

/**
 * Holds a value and use it with a runnable **of the same type**
 */
class Runner<A> {
  constructor(
    readonly value: A
  ) { }

  run(runnable: Runnable<A>) {
    runnable.run(this.value)
  }
}

/**
 * StringRunnable is accepted while it should not
 */
new Runner<unknown>(123 as unknown).run(new StringRunnable())

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