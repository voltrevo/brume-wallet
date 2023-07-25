import { Bytes } from "@hazae41/bytes"
import { ethers } from "ethers"
import { Keccak256 } from "../../hashes/keccak256"

export namespace Address {

  export function from(uncompressedPublicKey: Uint8Array) {
    const unprefixedPublicKey = uncompressedPublicKey.slice(1)
    const keccak256 = Keccak256.digest(unprefixedPublicKey)

    const raw = `0x${Bytes.toHex(keccak256.slice(-20))}`

    return ethers.getAddress(raw)
  }

  export function format(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

}