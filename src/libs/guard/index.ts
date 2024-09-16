
export type Coerce<Value, Strong, Weak> = Weak extends Value ? Value : Strong

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

  static is<X>(value: Coerce<X, null, unknown>): value is X & null {
    return value === null
  }

  is<X>(value: Coerce<X, null, unknown>): value is X & null {
    return value === null
  }

}

export class StrongEqualityGuard<T> {

  constructor(
    readonly value: T
  ) { }

  is<X>(value: Coerce<X, T, unknown>): value is X & T {
    return value === this.value
  }

}

export class WeakEqualityGuard<T> {

  constructor(
    readonly value: T
  ) { }

  is<X>(value: Coerce<X, T, unknown>): value is X & T {
    return value == this.value
  }

}

export class UndefinedGuard {

  constructor() { }

  static is<X>(value: Coerce<X, undefined, unknown>): value is X & undefined {
    return typeof value === "undefined"
  }

  is<X>(value: Coerce<X, undefined, unknown>): value is X & undefined {
    return typeof value === "undefined"
  }

}

export class BooleanGuard {

  constructor() { }

  static is<X>(value: Coerce<X, boolean, unknown>): value is X & boolean {
    return typeof value === "boolean"
  }

  is<X>(value: Coerce<X, boolean, unknown>): value is X & boolean {
    return typeof value === "boolean"
  }

}

export class TrueGuard {

  constructor() { }

  static is<X>(value: Coerce<X, true, unknown>): value is X & true {
    return value === true
  }

  is<X>(value: Coerce<X, true, unknown>): value is X & true {
    return value === true
  }

}

export class FalseGuard {

  constructor() { }

  static is<X>(value: Coerce<X, false, unknown>): value is X & false {
    return value === false
  }

  is<X>(value: Coerce<X, false, unknown>): value is X & false {
    return value === false
  }

}

export class StringGuard {

  constructor() { }

  static is<X>(value: Coerce<X, string, unknown>): value is X & string {
    return typeof value === "string"
  }

  is<X>(value: Coerce<X, string, unknown>): value is X & string {
    return typeof value === "string"
  }

}

export class NumberGuard {

  constructor() { }

  static is<X>(value: Coerce<X, number, unknown>): value is X & number {
    return typeof value === "number"
  }

  is<X>(value: Coerce<X, number, unknown>): value is X & number {
    return typeof value === "number"
  }

}

export class BigIntGuard {

  constructor() { }

  static is<X>(value: Coerce<X, bigint, unknown>): value is X & bigint {
    return typeof value === "bigint"
  }

  is<X>(value: Coerce<X, bigint, unknown>): value is X & bigint {
    return typeof value === "bigint"
  }

}

export class ObjectGuard {

  constructor() { }

  static is<X>(value: Coerce<X, object, unknown>): value is X & object {
    return typeof value === "object"
  }

  is<X>(value: Coerce<X, object, unknown>): value is X & object {
    return typeof value === "object"
  }

}

export class ArrayGuard {

  constructor() { }

  static is<X>(value: Coerce<X, unknown[], unknown>): value is X & unknown[] {
    return Array.isArray(value)
  }

  is<X>(value: Coerce<X, unknown[], unknown>): value is X & unknown[] {
    return Array.isArray(value)
  }

}

export class FunctionGuard {

  constructor() { }

  static is<X>(value: Coerce<X, Function, unknown>): value is X & Function {
    return typeof value === "function"
  }

  is<X>(value: Coerce<X, Function, unknown>): value is X & Function {
    return typeof value === "function"
  }

}


export class SymbolGuard {

  constructor() { }

  static is<X>(value: Coerce<X, symbol, unknown>): value is X & symbol {
    return typeof value === "symbol"
  }

  is<X>(value: Coerce<X, symbol, unknown>): value is X & symbol {
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

export class RecordGuard<T extends { [k: PropertyKey]: Guard<unknown, unknown> }> {

  constructor(
    readonly guard: T
  ) { }

  is(value: { [K in keyof T]: Guard.Input<T[K]> }): value is { [K in keyof T]: Guard.Input<T[K]> } & { [K in keyof T]: Guard.Output<T[K]> } {
    for (const key of Reflect.ownKeys(this.guard)) {
      if (typeof key === "symbol" && optionals.has(key)) {
        const truekey = key.description!

        if (truekey in value === false)
          continue
        if (value[truekey] === undefined)
          continue
        if (!this.guard[key].is(value[truekey]))
          return false
        continue
      }

      if (key in value === false)
        return false
      if (!this.guard[key].is(value[key]))
        return false
      continue
    }

    return true
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

  export function is<X extends string>(value: string extends X ? X : `0x${string}`): value is X & `0x${string}` {
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
  readonly array: <T>(inner: Guard<unknown, T>) => Guard<unknown, T[]>
  readonly inter: <I, A, B>(left: Guard<I, A>, right: Guard<I, B>) => InterGuard<I, A, B>
}

export type Parseable =
  | null
  | string
  | number
  | bigint
  | readonly Parseable[]
  | { [x: PropertyKey]: Parseable }
  | Guard.Bivariant<unknown, unknown>

export type Parsed<T> =
  T extends null ? Guard<T, T> :
  T extends string ? Guard<T, T> :
  T extends number ? Guard<T, T> :
  T extends bigint ? Guard<T, T> :
  T extends unknown[] ? never :
  T extends readonly unknown[] ? Guard<{ [K in keyof T]: Guard.Input<Parsed<T[K]>> }, { [K in keyof T]: Guard.Output<Parsed<T[K]>> }> :
  T extends Guard.Bivariant<unknown, unknown> ? T :
  T extends object ? Guard<{ [K in keyof T]: Guard.Input<Parsed<T[K]>> }, { [K in keyof T]: Guard.Output<Parsed<T[K]>> }> :
  never

function parse<T extends Parseable>(f: (toolbox: Toolbox) => T): Parsed<T> {
  const value = f({
    any: AnyGuard,
    never: NeverGuard,
    boolean: BooleanGuard,
    string: StringGuard,
    number: NumberGuard,
    bigint: BigIntGuard,
    object: ObjectGuard,
    symbol: SymbolGuard,
    array: <T>(inner: Guard<unknown, T>) => ({
      is(value: unknown): value is T[] {
        return ArrayGuard.is(value) && value.every(x => inner.is(x))
      }
    }),
    // array: inner => ({
    //   is(value): value is Guard.Output<typeof inner>[] {
    //     return ArrayGuard.is(value) && value.every(x => inner.is(x))
    //   },
    // }),
    inter: (left, right) => new InterGuard(left, right)
  })
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
parse(({ array, string }) => array(string)).is([])
const x = null as any

parse(() => ({
  hello: "world",
  hello2: "world"
})).is(x)

const y = null as unknown

if (parse(({ string }) => [string, string] as const).is(x)) {
}

declare const ReadonlySymbol: unique symbol

function readonly<T extends string>(key: T): T & { [ReadonlySymbol]: true } {
  return key as any
}

declare const OptionalSymbol: unique symbol

const optionals = new Set() // or WeakSet

function optional<T extends string>(key: T): symbol & { [OptionalSymbol]: T } {
  const symbol = Symbol(key)
  optionals.add(symbol)
  return symbol as any
}

const z = {
  [optional("x")]: "world"
}


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
