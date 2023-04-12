import { keccak_256 } from "@noble/hashes/sha3"

export namespace Keccak256 {

  export function digest(bytes: Uint8Array) {
    return keccak_256(bytes)
  }

}