import { Coerced } from "../../coerce"
import { Guard } from "../../guard"
import { LengthGuard, MaxLength, MaxLengthGuard, MinLength, MinLengthGuard } from "../lengths"
import { PipeGuard } from "../logicals"

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

export class StringGuardBuilder<O extends string> {

  constructor(
    readonly guard: Guard<unknown, O>
  ) { }

  asOrThrow(value: unknown): string {
    return this.guard.asOrThrow(value)
  }

  pipe<T extends Guard<O, unknown>>(guard: T): StringGuardBuilder<O & Guard.Output<T>> {
    return new StringGuardBuilder(new PipeGuard(this.guard, guard))
  }

  min<N extends number>(length: N): StringGuardBuilder<O & MinLength<N>> {
    return this.pipe(new MinLengthGuard(length))
  }

  max<N extends number>(length: N): StringGuardBuilder<O & MaxLength<N>> {
    return this.pipe(new MaxLengthGuard(length))
  }

  minmax<A extends number, B extends number>(min: A, max: B): StringGuardBuilder<O & MinLength<A> & MaxLength<B>> {
    return this.min(min).max(max)
  }

  length<N extends number>(length: N): StringGuardBuilder<O & { length: N }> {
    return this.pipe(new LengthGuard(length))
  }

  includes<S extends string>(value: S): StringGuardBuilder<O & StringIncludes<S>> {
    return this.pipe(new StringIncludesGuard(value))
  }

}

declare const StringIncludesSymbol: unique symbol

export interface StringIncludes<S extends string> {
  readonly [StringIncludesSymbol]: S
}

export class StringIncludesGuard<S extends string> {

  constructor(
    readonly value: S
  ) { }

  asOrThrow<X extends string>(value: X): X & StringIncludes<S> {
    if (!value.includes(this.value))
      throw new Error()
    return value as X & StringIncludes<S>
  }

}

