export interface Radixable {
  toString(radix: number): string
}

export namespace Hex {

  export function from(x: Radixable) {
    return `0x${x.toString(16)}`
  }

}