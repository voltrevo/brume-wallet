import { Base16 } from "@hazae41/base16"
import { Box, Copied } from "@hazae41/box"
import { Keccak256 } from "@hazae41/keccak256"
import { Ok, Result } from "@hazae41/result"
import { ethers } from "ethers"

export namespace Address {

  export function tryFrom(uncompressedPublicKey: Uint8Array): Result<string, Error> {
    return Result.unthrowSync(t => {
      const unprefixedPublicKeyCopied = new Box(new Copied(uncompressedPublicKey.slice(1)))
      using hashedSlice = Keccak256.get().tryHash(unprefixedPublicKeyCopied).throw(t)

      const hashedLast20Copied = new Box(new Copied(hashedSlice.bytes.slice(-20)))
      const raw = `0x${Base16.get().tryEncode(hashedLast20Copied).throw(t)}`

      return new Ok(ethers.getAddress(raw))
    })
  }

  export function format(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

}