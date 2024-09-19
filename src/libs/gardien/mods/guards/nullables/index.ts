import { Coerced } from "../../strict"

export class NullGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerced<X, unknown, null>): X & null {
    if (value !== null)
      throw new Error()
    return value as X & null
  }

  asOrThrow<X>(value: Coerced<X, unknown, null>): X & null {
    if (value !== null)
      throw new Error()
    return value as X & null
  }

}

export class UndefinedGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerced<X, unknown, undefined>): X & undefined {
    if (value !== undefined)
      throw new Error()
    return value as X & undefined
  }

  asOrThrow<X>(value: Coerced<X, unknown, undefined>): X & undefined {
    if (value !== undefined)
      throw new Error()
    return value as X & undefined
  }

}

export class NonNullableGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerced<X, unknown, null | undefined>): NonNullable<X> {
    if (value == null)
      throw new Error()
    return value as NonNullable<X>
  }

  asOrThrow<X>(value: Coerced<X, unknown, null | undefined>): NonNullable<X> {
    if (value == null)
      throw new Error()
    return value as NonNullable<X>
  }

}