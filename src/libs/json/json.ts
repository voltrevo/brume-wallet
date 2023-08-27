import { ZeroHexString } from "@hazae41/cubane"

export type Class<T> = new (...params: any[]) => T

export abstract class Guard<I, O> {
  abstract is(value: I): value is I & O

  /**
   * Unconditional intersection (A & B)
   * @param other 
   * @returns 
   */
  inter<T>(other: Guard<I, T>) {
    return new InterGuard<I, O, T>(this, other)
  }

  /**
   * Unconditional union (A | B)
   * @param other String.union(Boolean) -> string | boolean
   * @returns 
   */
  union<T>(other: Guard<I, T>) {
    return new UnionGuard<I, O, T>(this, other)
  }

  /**
   * Conditional union (A & B knowing A)
   * @example String.then(ZeroHexString) -> `0x${string}`
   * @example String.then(EmailString) -> `${string}@${string}.${string}`
   * @param other 
   * @returns 
   */
  then<T>(other: Guard<O, T>) {
    return new ThenGuard<I, O, T>(this, other)
  }

}

export class ThenGuard<I, X, O> extends Guard<I, O> {

  constructor(
    readonly a: Guard<I, X>,
    readonly b: Guard<X, O>
  ) {
    super()
  }

  is(value: I): value is I & O {
    return this.a.is(value) && this.b.is(value)
  }

}

export class ZeroHexStringGuard extends Guard<string, ZeroHexString> {

  is(value: string): value is `0x${string}` {
    return value.startsWith("0x")
  }

}

export class InterGuard<I, A, B> extends Guard<I, A & B> {

  constructor(
    readonly a: Guard<I, A>,
    readonly b: Guard<I, B>
  ) {
    super()
  }

  is(value: I): value is I & (A & B) {
    return this.a.is(value) && this.b.is(value)
  }

}

export class UnionGuard<I, A, B> extends Guard<I, A | B> {

  constructor(
    readonly a: Guard<I, A>,
    readonly b: Guard<I, B>
  ) {
    super()
  }

  is(value: I): value is I & (A | B) {
    return this.a.is(value) || this.b.is(value)
  }

}

export class StringGuard<I> extends Guard<I, string> {

  is(value: I): value is I & string {
    return typeof value === "string"
  }

}

export class BooleanGuard<I> extends Guard<I, boolean> {

  is(value: I): value is I & boolean {
    return typeof value === "boolean"
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