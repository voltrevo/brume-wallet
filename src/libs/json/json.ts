import { Err, Ok, Result } from "@hazae41/result"

export interface Guard<I, O> {
  is: (value: I) => value is I & O
}

export namespace Guard {

  export interface Bivariant<I, O> {
    is(value: I): value is I & O
  }

  export type Infer<T extends Bivariant<unknown, unknown>> = Guard<Input<T>, Output<T>>

  export type Input<T> = T extends Bivariant<infer I, unknown> ? I : never

  export type Output<T> = T extends Bivariant<unknown, infer O> ? O : never

  export function infer<T extends Guard.Infer<T>>(guard: T) {
    return guard as Bivariant<Input<T>, Output<T>>
  }

  /**
   * Try to cast value
   * @param value 
   * @returns 
   */
  export function tryAs<T extends Guard.Infer<T>>(guard: T, value: Guard.Input<T>): Result<Guard.Output<T>, Error> {
    if (guard.is(value))
      return new Ok(value)
    return new Err(new Error())
  }

  /**
   * Unconditional intersection (A & B)
   * @example Guard.from(new HasPropertyGuard("name")).inter(new HasPropertyGuard("age")) -> { name: unknown } & { age: unknown } -> { name: unknown, age: unknown }
   * @param other 
   * @returns 
   */
  export function inter<T extends Guard.Infer<T>, X>(left: T, right: Guard<Guard.Input<T>, X>) {
    return new InterGuard(left, right)
  }

  /**
   * Unconditional union (A | B)
   * @param other Guard.from(StringGuard).union(BooleanGuard) -> string | boolean
   * @returns 
   */
  export function union<I, A, B>(left: Guard<I, A>, right: Guard<I, B>) {
    return new UnionGuard<I, A, B>(left, right)
  }

  /**
   * Conditional intersection (A & B knowing A), used when `other` has O in input
   * @example Guard.from(StringGuard).then(ZeroHexStringGuard) -> `0x${string}`
   * @example Guard.from(StringGuard).then(EmailStringGuard) -> `${string}@${string}.${string}`
   * @example Guard.from(StringGuard).then(new MinLengthGuard(123)) -> string
   * @param other 
   * @returns 
   */
  export function then<I, X, O>(left: Guard<I, X>, right: Guard<X, O>) {
    return new ThenGuard<I, X, O>(left, right)
  }

  export function min<T extends { length: number }>(length: number) {
    return new MinLengthGuard<T>(length)
  }

  export function max<T extends { length: number }>(length: number) {
    return new MaxLengthGuard<T>(length)
  }

  export function len<T extends { length: number }, N extends number>(length: N) {
    return new LengthGuard<T, N>(length)
  }

}

export interface PropertyOptions {
  readonly required?: boolean
}

export abstract class Property<I, O> implements Guard<I, O> {
  abstract readonly options: PropertyOptions
  abstract is(value: I): value is I & O
}

export namespace Property {

  export function boolean() {
    return GuardedProperty.from(BooleanGuard)
  }

  export function string() {
    return GuardedProperty.from(StringGuard)
  }

  export function object<I, T extends { [property in PropertyKey]: Property<unknown, unknown> }>(schema: T) {
    return new ObjectProperty<I, T, { [P in keyof T]: Guard.Output<T[P]> }>(schema)
  }

}

export class GuardedProperty<I, O> extends Property<I, O> {

  constructor(
    readonly guard: Guard<I, O>,
    readonly options: PropertyOptions = {}
  ) {
    super()
  }

  static from<T extends Guard.Infer<T>>(guard: T, options?: PropertyOptions) {
    return new GuardedProperty(guard, options)
  }

  is(value: I): value is I & O {
    return this.guard.is(value)
  }

  tryAs(value: I): Result<O, Error> {
    if (this.is(value))
      return new Ok(value)
    return new Err(new Error())
  }

  inter<X>(other: Guard<I, I & X>) {
    return GuardedProperty.from(new InterGuard<I, O, I & X>(this, other), this.options)
  }

  then<X>(other: Guard<O, O & X>) {
    return GuardedProperty.from(new ThenGuard<I, O, O & X>(this, other), this.options)
  }

  required(required: boolean) {
    return new GuardedProperty(this.guard, { ...this.options, required })
  }

}

export class ObjectProperty<I, T extends { [property in PropertyKey]: Property<unknown, unknown> }, O extends { [P in keyof T]: Guard.Output<T[P]> }> {

  constructor(
    readonly guards: T,
    readonly options: PropertyOptions = {}
  ) { }

  is(value: I): value is I & O {
    if (!ObjectGuard.is(value))
      return false

    for (const [key, property] of Object.entries(this.guards)) {
      if (new HasPropertyGuard(key).is(value)) {
        if (!property.is(value[key]))
          return false
        continue
      }

      if (property.options.required === true)
        return false
      continue
    }

    return true
  }

  tryAs(value: I): Result<O, Error> {
    if (this.is(value))
      return new Ok(value)
    return new Err(new Error())
  }

  inter<X>(other: Guard<I, I & X>) {
    return GuardedProperty.from(new InterGuard<I, O, I & X>(this, other), this.options)
  }

  then<X>(other: Guard<O, O & X>) {
    return GuardedProperty.from(new ThenGuard<I, O, O & X>(this, other), this.options)
  }

  required(required: boolean) {
    return new ObjectProperty(this.guards, { ...this.options, required })
  }

}

export namespace AnyGuard {

  export function is<T>(value: T): value is T {
    return true
  }

}

export namespace NeverGuard {

  export function is<T>(value: T): value is T {
    return false
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

export class LengthGuard<T extends { length: number }, N extends number> {

  constructor(
    readonly length: N
  ) { }

  is(value: T): value is T & { length: N } {
    return value.length === this.length
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
export class ElementsGuard<T extends Guard.Infer<T>> {

  constructor(
    readonly subguard: T
  ) { }

  is(value: Guard.Input<T>[]): value is any[] & Guard.Output<T>[] {
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
    readonly subguard: Guard<unknown, O>
  ) { }

  is(value: { [property in P]: unknown }): value is { [property in P]: O } {
    return this.subguard.is(value[this.property])
  }

}

export class ThenGuard<I, X, O> implements Guard<I, O> {

  constructor(
    readonly left: Guard<I, X>,
    readonly right: Guard<X, O>
  ) { }

  is(value: I): value is I & O {
    return this.left.is(value) && this.right.is(value)
  }

}

export class InterGuard<I, A, B> implements Guard<I, A & B> {

  constructor(
    readonly left: Guard<I, A>,
    readonly right: Guard<I, B>
  ) { }

  is(value: I): value is I & (A & B) {
    return this.left.is(value) && this.right.is(value)
  }

}

export class UnionGuard<I, A, B> implements Guard<I, A | B> {

  constructor(
    readonly left: Guard<I, A>,
    readonly right: Guard<I, B>
  ) { }

  is(value: I): value is I & (A | B) {
    return this.left.is(value) || this.right.is(value)
  }

}

const hex = GuardedProperty.from(StringGuard)
  .then(ZeroHexStringGuard)
  .then(Guard.min(130))
  .tryAs(`0xdeadbeef4c6f72656d20697073756d20646f6c6f722073`)
  .getOrThrow()

const obj = Property.object({}).then(Guard.inter(
  new HasPropertyGuard("hello"),
  new HasPropertyGuard("world"))
).tryAs({})

Property
  .object({ hello: Property.string() })
  .inter(Property.object({ world: Property.string() }))

Property
  .string()
  .then(ZeroHexStringGuard)
  .required(true)
  .is("0xdeadbeef")

const object = Property.object({
  message: Property.string().then(ZeroHexStringGuard).then(Guard.min(2)).required(true)
}).tryAs({ message: "Oxdeadbeef" }).getOrThrow()

export class Json<T> {

  /**
   * Abstraction containing a schema and a text
   * @param schema 
   * @param inner 
   */
  constructor(
    readonly inner: string
  ) { }

  tryParse(guard: Guard<unknown, T>) {
    return Guard.tryAs(guard, JSON.parse(this.inner))
  }

}

function test(json: Json<string>) {
  const value = json.tryParse(Property.string())
}