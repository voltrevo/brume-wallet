import { FixedNumber } from "ethers"

export namespace BigInts {

  export function tryFloat(x?: bigint, d = 18) {
    if (!x) return

    try {
      return FixedNumber
        .fromValue(x, d)
        .round(3)
        .toUnsafeFloat()
    } catch (e: unknown) { }
  }

}

