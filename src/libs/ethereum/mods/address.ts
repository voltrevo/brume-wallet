import { Base16 } from "@hazae41/base16"
import { Keccak256 } from "@hazae41/keccak256"
import { Ok, Result } from "@hazae41/result"
import { ethers } from "ethers"

export namespace Address {

  export function tryFrom(uncompressedPublicKey: Uint8Array): Result<string, Error> {
    return Result.unthrowSync(t => {
      const unprefixedPublicKey = uncompressedPublicKey.slice(1)
      using hashedSlice = Keccak256.get().tryHash(unprefixedPublicKey).throw(t)

      const raw = `0x${Base16.get().tryEncode(hashedSlice.bytes.subarray(-20)).throw(t)}`

      return new Ok(ethers.getAddress(raw))
    })
  }

  export function format(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

}