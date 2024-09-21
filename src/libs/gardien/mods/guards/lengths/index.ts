export class LengthGuard<T extends { length: number }, N extends number> {

  constructor(
    readonly length: N
  ) { }

  asOrThrow(value: T): T & { length: N } {
    if (value.length !== this.length)
      throw new Error()
    return value as T & { length: N }
  }

}

declare const MinLengthSymbol: unique symbol

export interface MinLength<N extends number> {
  readonly [MinLengthSymbol]: N
}

export class MinLengthGuard<T extends { length: number }, N extends number> {

  constructor(
    readonly length: N
  ) { }

  asOrThrow(value: T): T & MinLength<N> {
    if (value.length < this.length)
      throw new Error()
    return value as T & MinLength<N>
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

  asOrThrow<T extends { length: number }>(value: T): T & MaxLength<N> {
    if (value.length > this.length)
      throw new Error()
    return value as T & MaxLength<N>
  }

}