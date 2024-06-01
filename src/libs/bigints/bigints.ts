import { ZeroHexString } from "@hazae41/cubane"
import { Result } from "@hazae41/result"

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

