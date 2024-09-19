import { Coerced } from "../../strict"

export class BooleanGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerced<X, unknown, boolean>): X & boolean {
    if (typeof value !== "boolean")
      throw new Error()
    return value as X & boolean
  }

  asOrThrow<X>(value: Coerced<X, unknown, boolean>): X & boolean {
    if (typeof value !== "boolean")
      throw new Error()
    return value as X & boolean
  }

}

export class TrueGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerced<X, unknown, true>): X & true {
    if (value !== true)
      throw new Error()
    return value as X & true
  }

  asOrThrow<X>(value: Coerced<X, unknown, true>): X & true {
    if (value !== true)
      throw new Error()
    return value as X & true
  }

}

export class FalseGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerced<X, unknown, false>): X & false {
    if (value !== false)
      throw new Error()
    return value as X & false
  }

  asOrThrow<X>(value: Coerced<X, unknown, false>): X & false {
    if (value !== false)
      throw new Error()
    return value as X & false
  }

}

export class NumberGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerced<X, unknown, number>): X & number {
    if (typeof value !== "number")
      throw new Error()
    return value as X & number
  }

  asOrThrow<X>(value: Coerced<X, unknown, number>): X & number {
    if (typeof value !== "number")
      throw new Error()
    return value as X & number
  }

}

export class NumberableGuard {

  constructor() { }

  static asOrThrow(value?: any): number {
    return Number(value)
  }

  asOrThrow(value?: any): number {
    return Number(value)
  }

}

export class BigIntGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerced<X, unknown, bigint>): X & bigint {
    if (typeof value !== "bigint")
      throw new Error()
    return value as X & bigint
  }

  asOrThrow<X>(value: Coerced<X, unknown, bigint>): X & bigint {
    if (typeof value !== "bigint")
      throw new Error()
    return value as X & bigint
  }

}

export class BigIntableGuard {

  constructor() { }

  static asOrThrow(value: string | number | bigint | boolean): bigint {
    return BigInt(value)
  }

  asOrThrow(value: string | number | bigint | boolean): bigint {
    return BigInt(value)
  }

}

export class ObjectGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerced<X, unknown, object>): X & object {
    if (typeof value !== "object")
      throw new Error()
    return value as X & object
  }

  asOrThrow<X>(value: Coerced<X, unknown, object>): X & object {
    if (typeof value !== "object")
      throw new Error()
    return value as X & object
  }

}

export class FunctionGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerced<X, unknown, Function>): X & Function {
    if (typeof value !== "function")
      throw new Error()
    return value as X & Function
  }

  asOrThrow<X>(value: Coerced<X, unknown, Function>): X & Function {
    if (typeof value !== "function")
      throw new Error()
    return value as X & Function
  }

}

export class SymbolGuard {

  constructor() { }

  static asOrThrow<X>(value: Coerced<X, unknown, symbol>): X & symbol {
    if (typeof value !== "symbol")
      throw new Error()
    return value as X & symbol
  }

  asOrThrow<X>(value: Coerced<X, unknown, symbol>): X & symbol {
    if (typeof value !== "symbol")
      throw new Error()
    return value as X & symbol
  }

}