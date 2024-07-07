import { ZeroHexString } from "@hazae41/cubane"

export namespace BigIntToHex {

  export function encodeOrThrow(value: bigint): ZeroHexString.Unsafe {
    return `0x${value.toString(16)}`
  }

  export function decodeOrThrow(value: ZeroHexString) {
    return value.length === 2 ? 0n : BigInt(value)
  }

}

