import { FixedNumber } from "ethers"

export namespace BigInts {

  export function float(x: bigint, d = 180) {
    return FixedNumber
      .fromValue(x, d)
      .round(3)
      .toUnsafeFloat()
  }

  export function tryFloat(x?: bigint, d = 18) {
    if (x == null) return

    return FixedNumber
      .fromValue(x, d)
      .round(3)
      .toUnsafeFloat()
  }

  export function stringify(value: bigint) {
    return `0x${value.toString(16)}`
  }

  export function parse(value: string) {
    return BigInt(value)
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

    this.value = BigInts.stringify(value)
    this.#tens = BigInts.tens(decimals)
  }

  static from(init: FixedInit) {
    if (init instanceof Fixed)
      return init
    const value = BigInts.parse(init.value)
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

