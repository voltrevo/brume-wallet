import { Coerce } from "../../coerce"

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

export class NonNullableGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerce<X, unknown, null | undefined>): NonNullable<X> {
    if (value == null)
      throw new Error()
    return value as NonNullable<X>
  }

  asOrThrow<X>(value: Coerce<X, unknown, null | undefined>): NonNullable<X> {
    if (value == null)
      throw new Error()
    return value as NonNullable<X>
  }

}