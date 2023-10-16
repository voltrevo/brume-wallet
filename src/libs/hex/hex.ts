import { ZeroHexString } from "@hazae41/cubane"

export interface Radixable {
  /**
   * Force bivariance to avoid .toString()
   * @param radix 
   * @returns 
   */
  toString: (radix: number) => string
}

export namespace Radix {

  export function toZeroHex(x: Radixable): ZeroHexString {
    return `0x${x.toString(16)}`
  }

}