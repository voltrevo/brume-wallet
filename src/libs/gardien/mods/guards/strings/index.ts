import { Coerced } from "../../coerce"
import { Errorer } from "../../errorer"
import { Guard } from "../../guard"
import { LengthGuard, MaxLength, MaxLengthGuard, MinLength, MinLengthGuard } from "../lengths"
import { InterGuard } from "../logicals"

export function string(message?: string) {
  return new StringGuardBuilder(new Errorer(StringGuard, () => new Error(message)))
}

export function stringable(message?: string) {
  return new StringGuardBuilder(new Errorer(StringableGuard, () => new Error(message)))
}

export class StringableGuard {

  constructor() { }

  static asOrThrow(value?: any): string {
    return String(value)
  }

  asOrThrow(value?: any): string {
    return String(value)
  }

}

export class StringGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerced<X, unknown, string>): X & string {
    if (typeof value !== "string")
      throw new Error()
    return value as X & string
  }

  asOrThrow<X>(value: Coerced<X, unknown, string>): X & string {
    if (typeof value !== "string")
      throw new Error()
    return value as X & string
  }

}

export class StringGuardBuilder<I, O extends string> {

  constructor(
    readonly guard: Guard<I, O>
  ) { }

  asOrThrow(value: I): string {
    return this.guard.asOrThrow(value)
  }

  pipe<P extends string>(guard: Guard<O, P>, message?: string): StringGuardBuilder<I, P> {
    return new StringGuardBuilder(new InterGuard(this.guard, new Errorer(guard, () => new Error(message))))
  }

  min<N extends number>(length: N, message?: string): StringGuardBuilder<I, O & MinLength<N>> {
    return this.pipe(new MinLengthGuard(length), message)
  }

  max<N extends number>(length: N, message?: string): StringGuardBuilder<I, O & MaxLength<N>> {
    return this.pipe(new MaxLengthGuard(length), message)
  }

  minmax<A extends number, B extends number>(min: A, max: B, message?: string): StringGuardBuilder<I, O & MinLength<A> & MaxLength<B>> {
    return this.pipe(new InterGuard(new MaxLengthGuard(max), new MinLengthGuard(min)), message)
  }

  length<N extends number>(length: N, message?: string): StringGuardBuilder<I, O & { length: N }> {
    return this.pipe(new LengthGuard(length), message)
  }

  includes<S extends string>(value: S, message?: string): StringGuardBuilder<I, O & StringIncludes<S>> {
    return this.pipe(new StringIncludesGuard(value), message)
  }

}

declare const StringIncludesSymbol: unique symbol

export interface StringIncludes<S extends string> {
  readonly [StringIncludesSymbol]: S
}

export class StringIncludesGuard<T extends string, S extends string> {

  constructor(
    readonly value: S
  ) { }

  asOrThrow(value: T): T & StringIncludes<S> {
    if (!value.includes(this.value))
      throw new Error()
    return value as T & StringIncludes<S>
  }

}