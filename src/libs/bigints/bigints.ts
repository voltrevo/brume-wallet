import { Err, Ok } from "@hazae41/result"
import { FixedNumber } from "ethers"

export namespace BigIntToHex {

  export function tryEncode(value: bigint) {
    return new Ok(`0x${value.toString(16)}`)
  }

  export function tryDecode(value: string) {
    return new Ok(BigInt(value))
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
    try {
      if (!text.trim().length)
        return new Err(new ParseError())
      return new Ok(BigInt(text))
    } catch (e: unknown) {
      return new Err(ParseError.from(e))
    }
  }

  export function tens(value: number) {
    return BigInt(`1${`0`.repeat(value)}`)
  }

}

export interface FixedInit {
  readonly value: string,
  readonly decimals: number
}

export class FixedInit {
  constructor(
    readonly value: string,
    readonly decimals: number
  ) { }
}

export class Fixed<D extends number = number> implements FixedInit {
  readonly #value: bigint
  readonly #tens: bigint

  readonly value: string
  readonly decimals: number

  constructor(value: bigint, decimals: D) {
    this.#value = value
    this.decimals = decimals

    this.value = BigIntToHex.tryEncode(value).get()
    this.#tens = BigInts.tens(decimals)
  }

  static from(init: FixedInit) {
    if (init instanceof Fixed)
      return init
    const value = BigIntToHex.tryDecode(init.value).get()
    return new Fixed(value, init.decimals)
  }

  move<D extends number>(decimals: D) {
    if (this.decimals > decimals)
      return new Fixed(this.#value / BigInts.tens(this.decimals - decimals), decimals)

    if (this.decimals < decimals)
      return new Fixed(this.#value * BigInts.tens(decimals - this.decimals), decimals)

    return new Fixed(this.#value, decimals)
  }

  div(other: Fixed) {
    return new Fixed((this.#value * this.#tens) / other.move(this.decimals).#value, this.decimals)
  }

  mul(other: Fixed) {
    return new Fixed((this.#value * other.move(this.decimals).#value) / this.#tens, this.decimals)
  }

  add(other: Fixed) {
    return new Fixed(this.#value + other.move(this.decimals).#value, this.decimals)
  }

  sub(other: Fixed) {
    return new Fixed(this.#value - other.move(this.decimals).#value, this.decimals)
  }

  toString() {
    const raw = this.#value.toString().padStart(this.decimals + 1, "0")
    const whole = raw.slice(0, -this.decimals).replaceAll("0", " ").trimStart().replaceAll(" ", "0")
    const decimal = raw.slice(-this.decimals).replaceAll("0", " ").trimEnd().replaceAll(" ", "0")
    return `${whole || "0"}.${decimal || "0"}`
  }

}

