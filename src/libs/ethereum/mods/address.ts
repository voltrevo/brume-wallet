import { Base16 } from "@hazae41/base16"
import { Ok, Result } from "@hazae41/result"
import { keccak_256 } from "@noble/hashes/sha3"
import { ethers } from "ethers"

export namespace Address {

  export function tryFrom(uncompressedPublicKey: Uint8Array): Result<string, Error> {
    return Result.unthrowSync(t => {
      const unprefixedPublicKey = uncompressedPublicKey.slice(1)
      const keccak256 = keccak_256(unprefixedPublicKey)

      const raw = `0x${Base16.get().tryEncode(keccak256.slice(-20)).throw(t)}`

      return new Ok(ethers.getAddress(raw))
    })
  }

  export function format(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

}