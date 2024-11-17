import { ZeroHexString } from "@hazae41/cubane"

export namespace BigIntToHex {

  export function encodeOrThrow(value: bigint): ZeroHexString.Unsafe {
    return `0x${value.toString(16)}`
  }

  export function decodeOrThrow(value: ZeroHexString) {
    return value.length === 2 ? 0n : BigInt(value)
  }

}

export namespace ZeroHexBigInt {

  export type From =
    | ZeroHexBigInt
    | ZeroHexString

}

export class ZeroHexBigInt {

  constructor(
    readonly value: bigint
  ) { }

  static from(value: ZeroHexBigInt.From) {
    if (value instanceof ZeroHexBigInt)
      return value
    if (value.length === 2)
      return new ZeroHexBigInt(0n)
    return new ZeroHexBigInt(BigInt(value))
  }

  toJSON() {
    return `0x${this.value.toString(16)}`
  }

}

