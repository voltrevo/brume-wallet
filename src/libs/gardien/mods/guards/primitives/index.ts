import { Coerce } from "../../coerce"

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