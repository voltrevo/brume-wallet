import { base58 } from "@scure/base"

export namespace Base58 {

  export function parse(text: string) {
    return base58.decode(text)
  }

  export function stringify(bytes: Uint8Array) {
    return base58.encode(bytes)
  }
}