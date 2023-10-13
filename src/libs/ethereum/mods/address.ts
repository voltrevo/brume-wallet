import { Base16 } from "@hazae41/base16"
import { ZeroHexString } from "@hazae41/cubane"
import { Keccak256 } from "@hazae41/keccak256"
import { Ok, Result } from "@hazae41/result"
import { ethers } from "ethers"

export namespace Address {

  export function tryFrom(uncompressedPublicKey: Uint8Array): Result<ZeroHexString, Error> {
    return Result.unthrowSync(t => {
      using hashedSlice = Keccak256.get().tryHash(uncompressedPublicKey.slice(1)).throw(t)
      const lowerCase = `0x${Base16.get().tryEncode(hashedSlice.bytes.slice(-20)).throw(t)}`

      return new Ok(ethers.getAddress(lowerCase) as ZeroHexString)
    })
  }

  export function format(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

}