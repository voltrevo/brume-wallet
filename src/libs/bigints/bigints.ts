import { FixedNumber } from "ethers"

export namespace BigInts {

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

export class Fixed<D extends number = number> {
  readonly #tens: bigint

  constructor(
    readonly value: bigint,
    readonly decimals: D
  ) {
    this.#tens = BigInts.tens(decimals)
  }

  move<D extends number>(decimals: D) {
    if (this.decimals > decimals)
      return new Fixed(this.value / BigInts.tens(this.decimals - decimals), decimals)

    if (this.decimals < decimals)
      return new Fixed(this.value * BigInts.tens(decimals - this.decimals), decimals)

    return new Fixed(this.value, decimals)
  }

  div(other: Fixed) {
    return new Fixed((this.value * this.#tens) / other.move(this.decimals).value, this.decimals)
  }

  mul(other: Fixed) {
    return new Fixed((this.value * other.move(this.decimals).value) / this.#tens, this.decimals)
  }

  toString() {
    const raw = this.value.toString().padStart(this.decimals + 1, "0")
    const whole = raw.slice(0, -this.decimals).replaceAll("0", " ").trimStart().replaceAll(" ", "0")
    const decimal = raw.slice(-this.decimals).replaceAll("0", " ").trimEnd().replaceAll(" ", "0")
    return `${whole || "0"}.${decimal || "0"}`
  }

}

