export class LengthGuard<N extends number> {

  constructor(
    readonly length: N
  ) { }

  asOrThrow<X extends { length: number }>(value: X): X & { length: N } {
    if (value.length !== this.length)
      throw new Error()
    return value as X & { length: N }
  }

}

declare const MinLengthSymbol: unique symbol

export interface MinLength<N extends number> {
  readonly [MinLengthSymbol]: N
}

export class MinLengthGuard<N extends number> {

  constructor(
    readonly length: N
  ) { }

  asOrThrow<X extends { length: number }>(value: X): X & MinLength<N> {
    if (value.length < this.length)
      throw new Error()
    return value as X & MinLength<N>
  }

}

declare const MaxLengthSymbol: unique symbol

export interface MaxLength<N extends number> {
  readonly [MaxLengthSymbol]: N
}

export class MaxLengthGuard<N extends number> {

  constructor(
    readonly length: N
  ) { }

  asOrThrow<X extends { length: number }>(value: X): X & MaxLength<N> {
    if (value.length > this.length)
      throw new Error()
    return value as X & MaxLength<N>
  }

}