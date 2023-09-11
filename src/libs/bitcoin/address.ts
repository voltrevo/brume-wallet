import { Bytes } from "@hazae41/bytes"
import { Cursor } from "@hazae41/cursor"
import { Ok, Result } from "@hazae41/result"
import { Base58 } from "../bases/base58"
import { Ripemd160 } from "../hashes/ripemd160"
import { Sha256 } from "../hashes/sha256"

export namespace Address {

  export async function tryFrom(maybeCompressedPublicKey: Uint8Array): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const sha256 = await Sha256.digest(maybeCompressedPublicKey)
      const ripemd160 = Ripemd160.digest(sha256)

      const cursor = new Cursor(Bytes.tryAllocUnsafe(1 + ripemd160.length + 4).throw(t))
      cursor.tryWriteUint8(0).throw(t)
      cursor.tryWrite(ripemd160).throw(t)

      const resha256 = await Sha256.digest(cursor.before)
      const reresha256 = await Sha256.digest(resha256)
      const checksum = reresha256.slice(0, 4)

      cursor.tryWrite(checksum).throw(t)

      return new Ok(Base58.stringify(cursor.bytes))
    })
  }

  export function format(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

}