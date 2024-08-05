import { Base58 } from "@hazae41/base58"
import { Cursor } from "@hazae41/cursor"
import { Ripemd160 } from "@hazae41/ripemd160"
import { Sha256 } from "../hashes/sha256"

export namespace Address {

  export async function fromOrThrow(maybeCompressedPublicKey: Uint8Array): Promise<string> {
    const sha256 = await Sha256.digest(maybeCompressedPublicKey)
    using ripemd160 = Ripemd160.get().tryHash(sha256).unwrap()

    const cursor = new Cursor(new Uint8Array(1 + ripemd160.bytes.length + 4))
    cursor.writeUint8OrThrow(0)
    cursor.writeOrThrow(ripemd160.bytes)

    const resha256 = await Sha256.digest(cursor.before)
    const reresha256 = await Sha256.digest(resha256)
    const checksum = reresha256.slice(0, 4)

    cursor.writeOrThrow(checksum)

    return Base58.get().tryEncode(cursor.bytes).unwrap()
  }

  export function format(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

}