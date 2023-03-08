export namespace Types {

  export function asString(x: unknown) {
    if (typeof x !== "string")
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

}