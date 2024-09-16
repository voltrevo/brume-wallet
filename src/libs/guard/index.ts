
export type Coerce<X, I, O> = O | (I extends X ? X : never)

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

  static is<X>(value: Coerce<X, unknown, null>): value is null {
    return value === null
  }

  is<X>(value: Coerce<X, unknown, null>): value is null {
    return value === null
  }

}

export class StrongEqualityGuard<T> {

  constructor(
    readonly value: T
  ) { }

  is<X>(value: Coerce<X, unknown, T>): value is T {
    return value === this.value
  }

}

export class WeakEqualityGuard<T> {

  constructor(
    readonly value: T
  ) { }

  is<X>(value: Coerce<X, unknown, T>): value is T {
    return value == this.value
  }

}

export class UndefinedGuard {

  constructor() { }

  static is<X>(value: Coerce<X, unknown, undefined>): value is undefined {
    return typeof value === "undefined"
  }

  is<X>(value: Coerce<X, unknown, undefined>): value is undefined {
    return typeof value === "undefined"
  }

}

export class BooleanGuard {

  constructor() { }

  static is<X>(value: Coerce<X, unknown, boolean>): value is boolean {
    return typeof value === "boolean"
  }

  is<X>(value: Coerce<X, unknown, boolean>): value is boolean {
    return typeof value === "boolean"
  }

}

export class TrueGuard {

  constructor() { }

  static is<X>(value: Coerce<X, unknown, true>): value is true {
    return value === true
  }

  is<X>(value: Coerce<X, unknown, true>): value is true {
    return value === true
  }

}

export class FalseGuard {

  constructor() { }

  static is<X>(value: Coerce<X, unknown, false>): value is false {
    return value === false
  }

  is<X>(value: Coerce<X, unknown, false>): value is false {
    return value === false
  }

}

export class StringGuard {

  constructor() { }

  static is<X>(value: Coerce<X, unknown, string>): value is string {
    return typeof value === "string"
  }

  is<X>(value: Coerce<X, unknown, string>): value is string {
    return typeof value === "string"
  }

}

export namespace ZeroHexStringGuard {

  export function is<X extends string>(value: Coerce<X, string, `0x${string}`>): value is `0x${string}` {
    return value.startsWith("0x")
  }

}

export class NumberGuard {

  constructor() { }

  static is<X>(value: Coerce<X, unknown, number>): value is number {
    return typeof value === "number"
  }

  is<X>(value: Coerce<X, unknown, number>): value is number {
    return typeof value === "number"
  }

}

export class BigIntGuard {

  constructor() { }

  static is<X>(value: Coerce<X, unknown, bigint>): value is bigint {
    return typeof value === "bigint"
  }

  is<X>(value: Coerce<X, unknown, bigint>): value is bigint {
    return typeof value === "bigint"
  }

}

export class ObjectGuard {

  constructor() { }

  static is<X>(value: Coerce<X, unknown, object>): value is object {
    return typeof value === "object"
  }

  is<X>(value: Coerce<X, unknown, object>): value is object {
    return typeof value === "object"
  }

}

export class ArrayGuard {

  constructor() { }

  static is<X>(value: Coerce<X, unknown, unknown[]>): value is unknown[] {
    return Array.isArray(value)
  }

  is<X>(value: Coerce<X, unknown, unknown[]>): value is unknown[] {
    return Array.isArray(value)
  }

}

export class ElementsGuard<T extends Guard<unknown, unknown>> {

  constructor(
    readonly subguard: T
  ) { }

  is<X>(value: Coerce<X, Guard.Input<T>, Guard.Output<T>>[]): value is Guard.Output<T>[] {
    return value.every(x => this.subguard.is(x))
  }

}

export class ArrayAndElementsGuard<T extends Guard<unknown, unknown>> {

  constructor(
    readonly subguard: T
  ) { }

  is<X>(value: Coerce<X, unknown, Guard.Output<T>[]>): value is Guard.Output<T>[] {
    return Array.isArray(value) && value.every(x => this.subguard.is(x))
  }

}

export class FunctionGuard {

  constructor() { }

  static is<X>(value: Coerce<X, unknown, Function>): value is Function {
    return typeof value === "function"
  }

  is<X>(value: Coerce<X, unknown, Function>): value is Function {
    return typeof value === "function"
  }

}


export class SymbolGuard {

  constructor() { }

  static is<X>(value: Coerce<X, unknown, symbol>): value is symbol {
    return typeof value === "symbol"
  }

  is<X>(value: Coerce<X, unknown, symbol>): value is symbol {
    return typeof value === "symbol"
  }

}

export class UnionGuard<I, A extends Guard<I, unknown>, B extends Guard<I, unknown>> {

  constructor(
    readonly left: A,
    readonly right: B
  ) { }

  is<X>(value: Coerce<X, I, Guard.Output<A> | Guard.Output<B>>): value is Guard.Output<A> | Guard.Output<B> {
    return this.left.is(value) || this.right.is(value)
  }

}

export class InterGuard<I, A extends Guard<I, unknown>, B extends Guard<I, unknown>> {

  constructor(
    readonly left: A,
    readonly right: B
  ) { }

  is<X>(value: Coerce<X, I, Guard.Output<A> & Guard.Output<B>>): value is Guard.Output<A> & Guard.Output<B> {
    return this.left.is(value) && this.right.is(value)
  }

}

export class ThenGuard<M, A extends Guard<unknown, M>, B extends Guard<M, unknown>> {

  constructor(
    readonly left: A,
    readonly right: B
  ) { }

  is<X>(value: Coerce<X, Guard.Input<A>, Guard.Output<A>>): value is Guard.Output<A> & Guard.Output<B> {
    return this.left.is(value) && this.right.is(value)
  }

}

export interface Guard<I, O> {
  is<X>(value: Coerce<X, I, O>): value is O
}

export namespace Guard {

  export interface Strict<I, O> {
    is: <X>(value: Coerce<X, I, O>) => value is O
  }

  export type Infer<T extends Guard<unknown, unknown>> = Guard<Input<T>, Output<T>>

  export type Input<T> = T extends Guard<infer I, unknown> ? I : never

  export type Output<T> = T extends Guard<unknown, infer O> ? O : never

  export function asOrThrow<T extends Guard.Infer<T>, X>(guard: T, value: Coerce<X, Guard.Input<T>, Guard.Output<T>>): Guard.Output<T> {
    if (!guard.is(value))
      throw new Error()
    return value
  }

  export function asOrNull<T extends Guard.Infer<T>, X>(guard: T, value: Coerce<X, Guard.Input<T>, Guard.Output<T>>): Guard.Output<T> | null {
    if (!guard.is(value))
      return null
    return value
  }

}

export class Guards {

  private constructor() { }

  static readonly any = AnyGuard
  static readonly never = NeverGuard
  static readonly null = NullGuard
  static readonly undefined = UndefinedGuard
  static readonly boolean = BooleanGuard
  static readonly true = TrueGuard
  static readonly false = FalseGuard
  static readonly string = StringGuard
  static readonly number = NumberGuard
  static readonly bigint = BigIntGuard
  static readonly object = ObjectGuard
  static readonly symbol = SymbolGuard
  static readonly function = FunctionGuard

  static array<T extends Guard<unknown, unknown>>(subguard: T) {
    return new ArrayAndElementsGuard(subguard)
  }

  static tuple<T extends readonly Guard<unknown, unknown>[]>(subguards: T) {
    return new TupleGuard(subguards)
  }

  static then<M, A extends Guard<unknown, M>, B extends Guard<M, unknown>>(left: A, right: B) {
    return new ThenGuard(left, right)
  }

  static inter<I, A extends Guard<I, unknown>, B extends Guard<I, unknown>>(left: A, right: B) {
    return new InterGuard(left, right)
  }

  static union<I, A extends Guard<I, unknown>, B extends Guard<I, unknown>>(left: A, right: B) {
    return new UnionGuard(left, right)
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


export class TupleGuard<T extends readonly Guard<unknown, unknown>[]> {

  constructor(
    readonly subguards: T
  ) { }

  is(value: { [K in keyof T]: Guard.Input<T[K]> }): value is { [K in keyof T]: Guard.Input<T[K]> } & { [K in keyof T]: Guard.Output<T[K]> } {
    return value.length === this.subguards.length && value.every((x, i) => this.subguards[i].is(x))
  }

}

export interface Toolbox {
  readonly boolean: BooleanGuard
  readonly string: StringGuard
  readonly number: NumberGuard
  readonly bigint: BigIntGuard
  readonly object: ObjectGuard
  readonly symbol: SymbolGuard
  readonly array: <T>(inner: Guard<unknown, T>) => Guard<unknown, T[]>
  readonly inter: <I, A extends Guard<I, unknown>, B extends Guard<I, unknown>>(a: A, b: B) => Guard<I, Guard.Output<A> & Guard.Output<B>>
  readonly union: <I, A extends Guard<I, unknown>, B extends Guard<I, unknown>>(a: A, b: B) => Guard<I, Guard.Output<A> | Guard.Output<B>>
  readonly then: <M, A extends Guard<unknown, M>, B extends Guard<M, unknown>>(a: A, b: B) => Guard<Guard.Input<A>, Guard.Output<A> & Guard.Output<B>>
}

export type Parseable =
  | null
  | string
  | number
  | bigint
  | readonly Parseable[]
  | { [x: PropertyKey]: Parseable }
  | Guard<unknown, unknown>

export type Parsed<T> =
  T extends null ? Guard<unknown, T> :
  T extends string ? Guard<unknown, T> :
  T extends number ? Guard<unknown, T> :
  T extends bigint ? Guard<unknown, T> :
  T extends unknown[] ? never :
  T extends readonly unknown[] ? Guard<unknown, { [K in keyof T]: Guard.Output<Parsed<T[K]>> }> :
  T extends Guard<unknown, unknown> ? T :
  T extends object ? Guard<unknown, { [K in keyof T]: Guard.Output<Parsed<T[K]>> }> :
  never

function parse<T extends Parseable>(f: (toolbox: Toolbox) => T): Parsed<T> {
  const { boolean, string, number, bigint, array, object, symbol, inter, union, then } = Guards

  const value = f({ boolean, string, number, bigint, array, object, symbol, inter, union, then })

  if (value == null)
    return NullGuard as any

  if (typeof value === "string")
    return StringGuard as any
  if (typeof value === "number")
    return NumberGuard as any
  if (typeof value === "bigint")
    return BigIntGuard as any

  if (Array.isArray(value))
    return new TupleGuard(value.map(x => parse(() => x))) as any

  if (Object.getPrototypeOf(value) === Object.prototype)
    return new RecordGuard(Object.fromEntries(Object.entries(value).map(([k, v]) => [k, parse(() => v)]))) as any

  return value as any
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
