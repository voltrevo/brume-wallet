export type Coerce<X, I, O> = O | (I extends X ? X : O)

export type Finalize<T> = {} & { [K in keyof T]: T[K] }


export interface Guard<I, O> {
  asOrThrow<X>(value: Coerce<X, I, O>): O
}

export namespace Guard {

  export interface Strict<I, O> {
    asOrThrow: <X>(value: Coerce<X, I, O>) => O
  }

  export type Infer<T extends Guard<unknown, unknown>> = Guard<Input<T>, Output<T>>

  export type Input<T> = T extends Guard<infer I, unknown> ? I : never

  export type Output<T> = T extends Guard<unknown, infer O> ? O : never

  export function asOrNull<T extends Guard.Infer<T>, X>(guard: T, value: Coerce<X, Guard.Input<T>, Guard.Output<T>>): X & Guard.Output<T> | null {
    try {
      return guard.asOrThrow(value) as X & Guard.Output<T>
    } catch {
      return null
    }
  }

  export function is<T extends Guard.Infer<T>, X>(guard: T, value: Coerce<X, Guard.Input<T>, Guard.Output<T>>): value is X & Guard.Output<T> {
    try {
      guard.asOrThrow(value)

      return true
    } catch {
      return false
    }
  }

}

export class AnyGuard {

  constructor() { }

  static asOrThrow<X>(value: X): X {
    return value
  }

  asOrThrow<X>(value: X): X {
    return value
  }

}

export class NeverGuard {

  constructor() { }

  static asOrThrow(value: never): never {
    throw new Error()
  }

  asOrThrow(value: never): never {
    throw new Error()
  }

}

export class NullGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, null>): X & null {
    if (value !== null)
      throw new Error()
    return value as X & null
  }

  asOrThrow<X>(value: Coerce<X, unknown, null>): X & null {
    if (value !== null)
      throw new Error()
    return value as X & null
  }

}

export class StrongEqualityGuard<T> {

  constructor(
    readonly value: T
  ) { }

  asOrThrow<X>(value: Coerce<X, unknown, T>): X & T {
    if (value !== this.value)
      throw new Error()
    return value as X & T
  }

}

export class WeakEqualityGuard<T> {

  constructor(
    readonly value: T
  ) { }

  asOrThrow<X>(value: Coerce<X, unknown, T>): X & T {
    if (value != this.value)
      throw new Error()
    return value as X & T
  }

}

export class UndefinedGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, undefined>): X & undefined {
    if (value !== undefined)
      throw new Error()
    return value as X & undefined
  }

  asOrThrow<X>(value: Coerce<X, unknown, undefined>): X & undefined {
    if (value !== undefined)
      throw new Error()
    return value as X & undefined
  }

}

export class BooleanGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, boolean>): X & boolean {
    if (typeof value !== "boolean")
      throw new Error()
    return value as X & boolean
  }

  asOrThrow<X>(value: Coerce<X, unknown, boolean>): X & boolean {
    if (typeof value !== "boolean")
      throw new Error()
    return value as X & boolean
  }

}

export class TrueGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, true>): X & true {
    if (value !== true)
      throw new Error()
    return value as X & true
  }

  asOrThrow<X>(value: Coerce<X, unknown, true>): X & true {
    if (value !== true)
      throw new Error()
    return value as X & true
  }

}

export class FalseGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, false>): X & false {
    if (value !== false)
      throw new Error()
    return value as X & false
  }

  asOrThrow<X>(value: Coerce<X, unknown, false>): X & false {
    if (value !== false)
      throw new Error()
    return value as X & false
  }

}

export class StringGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, string>): X & string {
    if (typeof value !== "string")
      throw new Error()
    return value as X & string
  }

  asOrThrow<X>(value: Coerce<X, unknown, string>): X & string {
    if (typeof value !== "string")
      throw new Error()
    return value as X & string
  }

}

export namespace ZeroHexStringGuard {

  export function asOrThrow<X extends string>(value: Coerce<X, string, `0x${string}`>): X & `0x${string}` {
    if (!value.startsWith("0x"))
      throw new Error()
    return value as X & `0x${string}`
  }

}

export class NumberGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, number>): X & number {
    if (typeof value !== "number")
      throw new Error()
    return value as X & number
  }

  asOrThrow<X>(value: Coerce<X, unknown, number>): X & number {
    if (typeof value !== "number")
      throw new Error()
    return value as X & number
  }

}

export class BigIntGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, bigint>): X & bigint {
    if (typeof value !== "bigint")
      throw new Error()
    return value as X & bigint
  }

  asOrThrow<X>(value: Coerce<X, unknown, bigint>): X & bigint {
    if (typeof value !== "bigint")
      throw new Error()
    return value as X & bigint
  }

}

export class ObjectGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, object>): X & object {
    if (typeof value !== "object")
      throw new Error()
    return value as X & object
  }

  asOrThrow<X>(value: Coerce<X, unknown, object>): X & object {
    if (typeof value !== "object")
      throw new Error()
    return value as X & object
  }

}

export class ArrayGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, unknown[]>): X & unknown[] {
    if (!Array.isArray(value))
      throw new Error()
    return value as X & unknown[]
  }

  asOrThrow<X>(value: Coerce<X, unknown, unknown[]>): X & unknown[] {
    if (!Array.isArray(value))
      throw new Error()
    return value as X & unknown[]
  }

}

export class ElementsGuard<T extends Guard<unknown, unknown>> {

  constructor(
    readonly subguard: T
  ) { }

  asOrThrow<X>(value: Coerce<X, Guard.Input<T>, Guard.Output<T>>[]): X & Guard.Output<T>[] {
    if (!value.every(x => this.subguard.asOrThrow(x)))
      throw new Error()
    return value as X & Guard.Output<T>[]
  }

}

export class ArrayAndElementsGuard<T extends Guard<unknown, unknown>> {

  constructor(
    readonly subguard: T
  ) { }

  asOrThrow<X>(value: Coerce<X, unknown, Guard.Output<T>[]>): X & Guard.Output<T>[] {
    if (!Array.isArray(value))
      throw new Error()
    if (!value.every(x => this.subguard.asOrThrow(x)))
      throw new Error()
    return value as X & Guard.Output<T>[]
  }

}

export class FunctionGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, Function>): X & Function {
    if (typeof value !== "function")
      throw new Error()
    return value as X & Function
  }

  asOrThrow<X>(value: Coerce<X, unknown, Function>): X & Function {
    if (typeof value !== "function")
      throw new Error()
    return value as X & Function
  }

}


export class SymbolGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, symbol>): X & symbol {
    if (typeof value !== "symbol")
      throw new Error()
    return value as X & symbol
  }

  asOrThrow<X>(value: Coerce<X, unknown, symbol>): X & symbol {
    if (typeof value !== "symbol")
      throw new Error()
    return value as X & symbol
  }

}

export class UnionGuard<I, A extends Guard<I, unknown>, B extends Guard<I, unknown>> {

  constructor(
    readonly left: A,
    readonly right: B
  ) { }

  asOrThrow<X>(value: Coerce<X, I, Guard.Output<A> | Guard.Output<B>>): X & (Guard.Output<A> | Guard.Output<B>) {
    let cause = []

    try {
      return this.left.asOrThrow(value) as X & Guard.Output<A>
    } catch (e: unknown) {
      cause.push(e)
    }

    try {
      return this.right.asOrThrow(value) as X & Guard.Output<B>
    } catch (e: unknown) {
      cause.push(e)
    }

    throw new Error(undefined, { cause })
  }

}

export class InterGuard<I, A extends Guard<I, unknown>, B extends Guard<I, unknown>> {

  constructor(
    readonly left: A,
    readonly right: B
  ) { }

  asOrThrow<X>(value: Coerce<X, I, Guard.Output<A> & Guard.Output<B>>): X & Guard.Output<A> & Guard.Output<B> {
    let cause = []

    try {
      this.left.asOrThrow(value)
    } catch (e: unknown) {
      cause.push(e)
    }

    try {
      this.right.asOrThrow(value)
    } catch (e: unknown) {
      cause.push(e)
    }

    if (cause.length > 0)
      throw new Error(undefined, { cause })

    return value as X & Guard.Output<A> & Guard.Output<B>
  }

}

export class ThenGuard<M, A extends Guard<unknown, M>, B extends Guard<M, unknown>> {

  constructor(
    readonly left: A,
    readonly right: B
  ) { }

  asOrThrow<X>(value: Coerce<X, Guard.Input<A>, Guard.Output<A>>): X & Guard.Output<A> & Guard.Output<B> {
    return this.right.asOrThrow(this.left.asOrThrow(value)) as X & Guard.Output<A> & Guard.Output<B>
  }

}

export class TupleGuard<T extends readonly Guard<unknown, unknown>[]> {

  constructor(
    readonly subguards: T
  ) { }

  asOrThrow(value: { [K in keyof T]: Guard.Input<T[K]> }): { [K in keyof T]: Guard.Input<T[K]> } & { [K in keyof T]: Guard.Output<T[K]> } {
    if (value.length !== this.subguards.length)
      throw new Error()
    if (!value.every((x, i) => this.subguards[i].asOrThrow(x)))
      throw new Error()
    return value as { [K in keyof T]: Guard.Input<T[K]> } & { [K in keyof T]: Guard.Output<T[K]> }
  }

}

export class RecordGuard<T extends { [k: PropertyKey]: Property<Guard<unknown, unknown>> }> {

  constructor(
    readonly guard: T
  ) { }

  asOrThrow(value: { [K in keyof T]: Guard.Input<T[K]> }): value is { [K in keyof T]: Guard.Input<T[K]> } & { [K in keyof T]: Guard.Output<T[K]> } {
    for (const key of Reflect.ownKeys(this.guard)) {
      const guard = this.guard[key]

      if (guard instanceof OptionalProperty) {
        if (key in value === false)
          continue
        if (value[key] === undefined)
          continue
        guard.value.asOrThrow(value[key])
        continue
      }

      if (guard instanceof ReadonlyProperty) {
        if (key in value === false)
          return false
        guard.value.asOrThrow(value[key])
        continue
      }

      if (key in value === false)
        return false
      guard.asOrThrow(value[key])
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

class OptionalProperty<T> {
  readonly #class = OptionalProperty

  constructor(
    readonly value: T
  ) { }
}

type AsOptional<T, K extends keyof T> = T[K] extends OptionalProperty<unknown> ? K : never
type AsNotOptional<T, K extends keyof T> = T[K] extends OptionalProperty<unknown> ? never : K

type OfOptional<T> = T extends OptionalProperty<infer U> ? U : never
type OfNotOptional<T> = T extends OptionalProperty<unknown> ? never : T


type Unoptional<T> = { [K in keyof T as AsOptional<T, K>]?: OfOptional<T[K]> } & { [K in keyof T as AsNotOptional<T, K>]-?: OfNotOptional<T[K]> }

class ReadonlyProperty<T> {
  readonly #class = ReadonlyProperty

  constructor(
    readonly value: T
  ) { }
}

type AsReadonly<T, K extends keyof T> = T[K] extends ReadonlyProperty<unknown> ? K : never
type AsNotReadonly<T, K extends keyof T> = T[K] extends ReadonlyProperty<unknown> ? never : K

type OfReadonly<T> = T extends ReadonlyProperty<infer U> ? U : never
type OfNotReadonly<T> = T extends ReadonlyProperty<unknown> ? never : T

type Unreadonly<T> = { readonly [K in keyof T as AsReadonly<T, K>]: OfReadonly<T[K]> } & { -readonly [K in keyof T as AsNotReadonly<T, K>]: OfNotReadonly<T[K]> }

type Property<T> =
  | T
  | OptionalProperty<T>
  | ReadonlyProperty<T>

export type Parsed<T> =
  T extends unknown[] ? never :
  T extends readonly unknown[] ? Guard<unknown, Finalize<Subparsed<T>>> :
  T extends Guard<unknown, unknown> ? T :
  T extends object ? Guard<unknown, Finalize<Subparsed<Unoptional<Unreadonly<T>>>>> :
  Guard<unknown, T>

type Subparsed<T> = { [K in keyof T]: Guard.Output<Parsed<T[K]>> }

export interface Toolbox {
  readonly boolean: BooleanGuard
  readonly string: StringGuard
  readonly number: NumberGuard
  readonly bigint: BigIntGuard
  readonly object: ObjectGuard
  readonly symbol: SymbolGuard

  readonly optional: <T>(value: T) => OptionalProperty<T>
  readonly readonly: <T>(value: T) => ReadonlyProperty<T>

  readonly array: <T>(inner: T) => Guard<unknown, Guard.Output<Parsed<T>>[]>

  readonly inter: <I, A extends Guard<I, unknown>, B extends Guard<I, unknown>>(a: A, b: B) => Guard<I, Guard.Output<A> & Guard.Output<B>>
  readonly union: <I, A extends Guard<I, unknown>, B extends Guard<I, unknown>>(a: A, b: B) => Guard<I, Guard.Output<A> | Guard.Output<B>>

  readonly then: <M, A extends Guard<unknown, M>, B extends Guard<M, unknown>>(a: A, b: B) => Guard<Guard.Input<A>, Guard.Output<A> & Guard.Output<B>>
}

function parse<T>(f: (toolbox: Toolbox) => T): Parsed<T> {
  const boolean = BooleanGuard
  const string = StringGuard
  const number = NumberGuard
  const bigint = BigIntGuard
  const object = ObjectGuard
  const symbol = SymbolGuard

  function optional<T>(value: T): OptionalProperty<T> {
    return new OptionalProperty(value)
  }

  function readonly<T>(value: T): ReadonlyProperty<T> {
    return new ReadonlyProperty(value)
  }

  function array<T>(inner: T): Guard<unknown, Guard.Output<Parsed<T>>[]> {
    return new ArrayAndElementsGuard(parse(() => inner))
  }

  function inter<I, A extends Guard<I, unknown>, B extends Guard<I, unknown>>(a: A, b: B): Guard<I, Guard.Output<A> & Guard.Output<B>> {
    return new InterGuard(a, b)
  }

  function union<I, A extends Guard<I, unknown>, B extends Guard<I, unknown>>(a: A, b: B): Guard<I, Guard.Output<A> | Guard.Output<B>> {
    return new UnionGuard(a, b)
  }

  function then<M, A extends Guard<unknown, M>, B extends Guard<M, unknown>>(a: A, b: B): Guard<Guard.Input<A>, Guard.Output<A> & Guard.Output<B>> {
    return new ThenGuard(a, b)
  }

  const value = f({ boolean, string, number, bigint, array, object, symbol, optional, readonly, inter, union, then })

  if (value == null)
    return NullGuard as any

  if (Array.isArray(value))
    return new TupleGuard(value.map(x => parse(() => x))) as any

  if (Object.getPrototypeOf(value) === Object.prototype)
    return new RecordGuard(Object.fromEntries(Object.entries(value).map(([k, v]) => {
      if (v instanceof ReadonlyProperty)
        return [k, readonly(parse(() => v))]
      if (v instanceof OptionalProperty)
        return [k, optional(parse(() => v))]
      return [k, parse(() => v)]
    }))) as any

  if (typeof value === "object" && "asOrThrow" in value)
    return value as any

  return new StrongEqualityGuard(value) as any
}

parse(() => null)
parse(() => "hello")
parse(() => 123)
parse(() => 123n)
parse(({ string }) => string)
parse(({ array, string }) => array(string))

const obj = parse(({ readonly, optional }) => ({
  hello: readonly("world"),
  hello2: optional("world")
})).asOrThrow({ hello: "world" })

export class Json<T> {

  constructor(
    readonly text: string
  ) { }

  parseOrThrow(guard: Guard<unknown, T>) {
    return guard.asOrThrow(JSON.parse(this.text))
  }

}

function test(json: Json<string>) {
  const value = json.parseOrThrow(StringGuard)
}
