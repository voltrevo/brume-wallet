import { Err, Ok, Result } from "@hazae41/result"
import { isFirefoxExtension } from "../platform/platform"

export class AnyGuard {

  constructor() { }

  static is<T>(value: T): value is T {
    return true
  }

  is<T>(value: T): value is T {
    return true
  }

}

export class NeverGuard {

  constructor() { }

  static is<T>(value: T): value is T {
    return false
  }

  is<T>(value: T): value is T {
    return false
  }

}

export class NullGuard {

  constructor() { }

  static is(value: unknown): value is null {
    return value === null
  }

  is(value: unknown): value is null {
    return value === null
  }

}

export class StrongEqualityGuard<T> {

  constructor(
    readonly value: T
  ) { }

  is(value: unknown): value is T {
    return value === this.value
  }

}

export class WeakEqualityGuard<T> {

  constructor(
    readonly value: T
  ) { }

  is(value: unknown): value is T {
    return value == this.value
  }

}

export class UndefinedGuard {

  constructor() { }

  static is(value: unknown): value is undefined {
    return typeof value === "undefined"
  }

  is(value: unknown): value is undefined {
    return typeof value === "undefined"
  }

}

export class BooleanGuard {

  constructor() { }

  static is(value: unknown): value is boolean {
    return typeof value === "boolean"
  }

  is(value: unknown): value is boolean {
    return typeof value === "boolean"
  }

}

export class TrueGuard {

  constructor() { }

  static is(value: unknown): value is true {
    return value === true
  }

  is(value: unknown): value is true {
    return value === true
  }

}

export class FalseGuard {

  constructor() { }

  static is(value: unknown): value is false {
    return value === false
  }

  is(value: unknown): value is false {
    return value === false
  }

}

export class StringGuard {

  constructor() { }

  static is(value: unknown): value is string {
    return typeof value === "string"
  }

  is(value: unknown): value is string {
    return typeof value === "string"
  }

}

export class NumberGuard {

  constructor() { }

  static is(value: unknown): value is number {
    return typeof value === "number"
  }

  is(value: unknown): value is number {
    return typeof value === "number"
  }

}

export class BigIntGuard {

  constructor() { }

  static is(value: unknown): value is bigint {
    return typeof value === "bigint"
  }

  is(value: unknown): value is bigint {
    return typeof value === "bigint"
  }

}

export class ObjectGuard {

  constructor() { }

  static is(value: unknown): value is object {
    return typeof value === "object"
  }

  is(value: unknown): value is object {
    return typeof value === "object"
  }

}

export class ArrayGuard {

  constructor() { }

  static is(value: unknown): value is unknown[] {
    return Array.isArray(value)
  }

  is(value: unknown): value is unknown[] {
    return Array.isArray(value)
  }

}

export class FunctionGuard {

  constructor() { }

  static is(value: unknown): value is Function {
    return typeof value === "function"
  }

  is(value: unknown): value is Function {
    return typeof value === "function"
  }

}

export class SymbolGuard {

  constructor() { }

  static is(value: unknown): value is symbol {
    return typeof value === "symbol"
  }

  is(value: unknown): value is symbol {
    return typeof value === "symbol"
  }

}

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

  export function asOrThrow<T extends Guard.Infer<T>>(guard: T, value: Guard.Input<T>): Guard.Output<T> {
    if (!guard.is(value))
      throw new Error()
    return value
  }

  export function asOrNull<T extends Guard.Infer<T>>(guard: T, value: Guard.Input<T>): Guard.Output<T> | null {
    if (!guard.is(value))
      return null
    return value
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

}

export interface PropertyOptions {
  readonly required?: boolean
}

export abstract class Property<I, O> implements Guard<I, O> {
  abstract readonly options: PropertyOptions
  abstract is(value: I): value is I & O
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

  // inter<X>(other: Guard<I, I & X>) {
  //   return GuardedProperty.from(new InterGuard<I, O, I & X>(this, other), this.options)
  // }

  // then<X>(other: Guard<O, O & X>) {
  //   return GuardedProperty.from(new ThenGuard<I, O, O & X>(this, other), this.options)
  // }

  required(required: boolean) {
    return new ObjectProperty(this.guards, { ...this.options, required })
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

declare const MaxLengthSymbol: unique symbol

export interface MaxLength<N extends number> {
  readonly [MaxLengthSymbol]: N
}

export class MaxLengthGuard<T extends { length: number }, N extends number> {

  constructor(
    readonly length: N
  ) { }

  is(value: T): value is T & MaxLength<N> {
    return value.length < this.length
  }

}

export namespace ZeroHexStringGuard {

  export function is(value: string): value is `0x${string}` {
    return value.startsWith("0x")
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

export class TupleGuard<T extends readonly Guard<unknown, unknown>[]> {

  constructor(
    readonly subguards: T
  ) { }

  is(value: { [K in keyof T]: Guard.Input<T[K]> }): value is { [K in keyof T]: Guard.Input<T[K]> } & { [K in keyof T]: Guard.Output<T[K]> } {
    return value.length === this.subguards.length && value.every((x, i) => this.subguards[i].is(x))
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

export interface Toolbox {
  readonly any: AnyGuard
  readonly never: NeverGuard
  readonly boolean: BooleanGuard
  readonly string: StringGuard
  readonly number: NumberGuard
  readonly bigint: BigIntGuard
  readonly object: ObjectGuard
  readonly symbol: SymbolGuard
  readonly array: <I extends Guard.Infer<I>>(inner: I) => Guard<unknown, Guard.Output<I>[]>
  readonly inter: <I, A, B>(left: Guard<I, A>, right: Guard<I, B>) => InterGuard<I, A, B>
  readonly readonly: (key: string) => symbol
}

export type Parseable =
  | null
  | string
  | number
  | bigint
  | Guard.Bivariant<unknown, unknown>
  | readonly Parseable[]
// | { [x: PropertyKey]: Parseable }

export type Parsed<T> =
  | NullGuardFrom<T>
  | (T extends string ? StrongEqualityGuard<T> : never)
  | (T extends number ? StrongEqualityGuard<T> : never)
  | (T extends bigint ? StrongEqualityGuard<T> : never)
  | (T extends Guard.Bivariant<unknown, unknown> ? T : never)
  | (T extends Parseable[] ? never : never)
  | TupleGuardFrom<T>

export type NullGuardFrom<T> =
  T extends null ? NullGuard :
  never

export type TupleGuardFrom<T> =
  T extends unknown[] ? never :
  T extends readonly unknown[] ? TupleGuard<{ [K in keyof T]: Parsed<T[K]> }> :
  never

function parse<T extends Parseable>(f: (toolbox: Toolbox) => T): Parsed<T> {
  return null as any
}

// parse(({ string }) => ({
//   hello: string,
//   hello2: null,
// }))


parse(() => null)
parse(() => "hello")
parse(() => 123)
parse(() => 123n)
parse(({ string }) => string)
parse(({ array, string }) => array(string))
const x = null as any

if (parse(({ string }) => [string, string] as const).is(x)) {
}

namespace Properties {
  export const readonly = isFirefoxExtension() ? new WeakSet() : new Set()
}

function readonly(key: string) {
  const symbol = Symbol(key)
  Properties.readonly.add(symbol)
  return symbol
}

const z = {
  ["hello"]: "world",
  [readonly("hello")]: "world"
}

function lol<T>(f: () => T) {

}

lol(() => [1, 2] as const)

export class Json<T> {

  constructor(
    readonly text: string
  ) { }

  parseOrThrow(guard: Guard<unknown, T>) {
    return Guard.asOrThrow(guard, JSON.parse(this.text))
  }

}

function test(json: Json<string>) {
  const value = json.parseOrThrow(StringGuard)
}