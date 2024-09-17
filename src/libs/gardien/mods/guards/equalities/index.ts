import { Coerce } from "../../coerce"

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