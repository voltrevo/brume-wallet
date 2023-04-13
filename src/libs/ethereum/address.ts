import { Bytes } from "@hazae41/bytes"
import { Keccak256 } from "../hashes/keccak256"

export namespace Address {

  export function from(uncompressedPublicKey: Uint8Array) {
    const unprefixedPublicKey = uncompressedPublicKey.slice(1)
    const keccak256 = Keccak256.digest(unprefixedPublicKey)

    return `0x${Bytes.toHex(keccak256.slice(-20))}`
  }

  export function format(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

}