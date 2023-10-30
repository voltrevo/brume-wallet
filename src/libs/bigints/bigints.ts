import { ZeroHexString } from "@hazae41/cubane"
import { Err, Ok, Result } from "@hazae41/result"
import { FixedNumber } from "ethers"

export namespace BigIntToHex {

  export function tryEncode(value: bigint): Result<ZeroHexString, never> {
    return new Ok(encode(value))
  }

  export function tryDecode(value: string) {
    return new Ok(decode(value))
  }

  export function encode(value: bigint): ZeroHexString {
    return `0x${value.toString(16)}`
  }

  export function decode(value: string) {
    return BigInt(value)
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

  export function tryParseInput(text: string) {
    if (text.trim().length === 0)
      return new Err(new ParseError())

    try {
      return new Ok(BigInt(text))
    } catch (e: unknown) {
      return new Err(ParseError.from(e))
    }
  }

  export function tens(value: number) {
    return BigInt(`1${`0`.repeat(value)}`)
  }

}
