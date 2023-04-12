import { ripemd160 } from "@noble/hashes/ripemd160";

export namespace Ripemd160 {

  export function digest(bytes: Uint8Array) {
    return ripemd160(bytes)
  }

}