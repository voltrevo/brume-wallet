import { ZeroHexString } from "@hazae41/cubane"
import { BigIntToHex, BigInts } from "../bigints/bigints"

export type FixedInit =
  | Fixed
  | ZeroHexFixed

export interface ZeroHexFixed {
  readonly value: ZeroHexString,
  readonly decimals: number
}

export class ZeroHexFixed {
  constructor(
    readonly value: ZeroHexString,
    readonly decimals: number
  ) { }
}

export class Fixed<D extends number = number> {
  readonly tens: bigint

  constructor(
    readonly value: bigint,
    readonly decimals: D
  ) {
    this.tens = BigInts.tens(decimals)
  }

  static from(init: FixedInit) {
    if (init instanceof Fixed)
      return init
    return this.fromJSON(init)
  }

  toJSON() {
    const value = BigIntToHex.tryEncode(this.value).get()
    const decimals = this.decimals
    return new ZeroHexFixed(value, decimals)
  }

  static fromJSON(init: ZeroHexFixed) {
    const value = BigIntToHex.tryDecode(init.value).get()
    return new Fixed(value, init.decimals)
  }

  move<D extends number>(decimals: D) {
    if (this.decimals > decimals)
      return new Fixed(this.value / BigInts.tens(this.decimals - decimals), decimals)

    if (this.decimals < decimals)
      return new Fixed(this.value * BigInts.tens(decimals - this.decimals), decimals)

    return new Fixed(this.value, decimals)
  }

  div(other: Fixed) {
    return new Fixed((this.value * this.tens) / other.move(this.decimals).value, this.decimals)
  }

  mul(other: Fixed) {
    return new Fixed((this.value * other.move(this.decimals).value) / this.tens, this.decimals)
  }

  add(other: Fixed) {
    return new Fixed(this.value + other.move(this.decimals).value, this.decimals)
  }

  sub(other: Fixed) {
    return new Fixed(this.value - other.move(this.decimals).value, this.decimals)
  }

  toDecimalString() {
    const raw = this.value.toString().padStart(this.decimals + 1, "0")
    const whole = raw.slice(0, -this.decimals).replaceAll("0", " ").trimStart().replaceAll(" ", "0")
    const decimal = raw.slice(-this.decimals).replaceAll("0", " ").trimEnd().replaceAll(" ", "0")
    return `${whole || "0"}.${decimal || "0"}`
  }

  static fromDecimalString<D extends number>(text: string, decimals: D) {
    const [whole = "0", decimal = "0"] = text.split(".")
    const value = BigInt(whole + decimal.padEnd(decimals, "0"))
    return new Fixed(value, decimals)
  }

}
