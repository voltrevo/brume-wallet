export namespace Types {

  export function isString(x: unknown): x is string {
    return typeof x === "string"
  }

  export function asString(x: unknown) {
    if (!isString(x))
      throw new TypeError()
    return x
  }

  export function asStringOr<T>(x: unknown, or: T) {
    try {
      return asString(x)
    } catch (e: unknown) {
      return or
    }
  }

  export function isBigInt(x: unknown): x is bigint {
    return typeof x === "string"
  }

}