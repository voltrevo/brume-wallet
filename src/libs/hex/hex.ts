export interface Radixable {
  toString(radix: number): string
}

export namespace Radix {

  export function toHex(x: Radixable) {
    return `0x${x.toString(16)}`
  }

}