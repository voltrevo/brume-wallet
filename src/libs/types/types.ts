export namespace Types {

  export function asString(x: unknown) {
    if (typeof x !== "string")
      throw new TypeError()
    return x
  }

}