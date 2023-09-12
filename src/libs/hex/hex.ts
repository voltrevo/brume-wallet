export interface Radixable {
  toString(radix: number): string
}

export namespace Radix {

  export function toZeroHex(x: Radixable) {
    return `0x${x.toString(16)}`
  }

}