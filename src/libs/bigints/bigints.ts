import { FixedNumber } from "ethers"

export namespace BigInts {

  export function is(x: unknown): x is bigint {
    return typeof x === "bigint"
  }

  export function float(x: bigint, d = 180) {
    return FixedNumber
      .fromValue(x, d)
      .round(3)
      .toUnsafeFloat()
  }

  export function tryFloat(x?: bigint, d = 18) {
    if (x === undefined) return

    return FixedNumber
      .fromValue(x, d)
      .round(3)
      .toUnsafeFloat()
  }

}

