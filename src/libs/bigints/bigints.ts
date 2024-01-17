import { ZeroHexString } from "@hazae41/cubane"
import { Result } from "@hazae41/result"
import { FixedNumber } from "ethers"

export namespace BigIntToHex {

  export function encodeOrThrow(value: bigint): ZeroHexString {
    return `0x${value.toString(16)}`
  }

  export function decodeOrThrow(value: ZeroHexString) {
    return value.length === 2 ? 0n : BigInt(value)
  }

  export function tryDecode(value: ZeroHexString) {
    return Result.runAndDoubleWrapSync(() => decodeOrThrow(value))
  }

}

export namespace BigInts {

  export class ParseError extends Error {
    readonly #class = ParseError
    readonly name = this.#class.name

    constructor(options?: ErrorOptions) {
      super(`Could not parse`, options)
    }

    static from(cause: unknown) {
      return new ParseError({ cause })
    }
  }

  export function float(x: bigint, d = 180) {
    return FixedNumber
      .fromValue(x, d)
      .round(3)
      .toUnsafeFloat()
  }

  export function parseOrThrow(text: string) {
    if (text.trim().length === 0)
      throw new ParseError()
    return BigInt(text)
  }

  export function tens(value: number) {
    return BigInt(`1${`0`.repeat(value)}`)
  }

}
