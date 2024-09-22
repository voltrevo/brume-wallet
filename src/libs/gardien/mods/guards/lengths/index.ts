import { Override, Super } from "../../super"

export class LengthGuard<N extends number> {

  constructor(
    readonly length: N
  ) { }

  asOrThrow<X extends { length: N }>(value: X): X

  asOrThrow<X extends { length: number }>(value: Super<X, Override<X, { length: N }>>): Override<X, { length: N }>

  asOrThrow<X extends { length: number }>(value: X): Override<X, { length: N }> {
    if (value.length !== this.length)
      throw new Error()
    return value as Override<X, { length: N }>
  }

}

declare const MinSymbol: unique symbol

export interface Min<N extends number> {
  readonly [MinSymbol]: N
}

export class MinLengthGuard<N extends number> {

  constructor(
    readonly length: N
  ) { }

  asOrThrow<X extends { length: Min<N> }>(value: X): X

  asOrThrow<X extends { length: number }>(value: Super<X, Override<X, { length: Min<N> }>>): Override<X, { length: Min<N> }>

  asOrThrow<X extends { length: number }>(value: X): Override<X, { length: Min<N> }> {
    if (value.length < this.length)
      throw new Error()
    return value as Override<X, { length: Min<N> }>
  }

}

declare const MaxSymbol: unique symbol

export interface Max<N extends number> {
  readonly [MaxSymbol]: N
}

export class MaxLengthGuard<N extends number> {

  constructor(
    readonly length: N
  ) { }

  asOrThrow<X extends { length: Max<N> }>(value: X): X

  asOrThrow<X extends { length: number }>(value: Super<X, Override<X, { length: Max<N> }>>): Override<X, { length: Max<N> }>

  asOrThrow<X extends { length: number }>(value: X): Override<X, { length: Max<N> }> {
    if (value.length > this.length)
      throw new Error()
    return value as Override<X, { length: Max<N> }>
  }

}