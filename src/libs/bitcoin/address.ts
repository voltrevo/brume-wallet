import { Cursor } from "@hazae41/binary"
import { Base58 } from "../bases/base58"
import { Ripemd160 } from "../hashes/ripemd160"
import { Sha256 } from "../hashes/sha256"

export namespace Address {

  export async function from(publicKey: Uint8Array) {
    const sha256 = await Sha256.digest(publicKey)
    const ripemd160 = Ripemd160.digest(sha256)

    const cursor = Cursor.allocUnsafe(1 + ripemd160.length + 4)
    cursor.writeUint8(0)
    cursor.write(ripemd160)

    const resha256 = await Sha256.digest(cursor.before)
    const reresha256 = await Sha256.digest(resha256)
    const checksum = reresha256.slice(0, 4)

    cursor.write(checksum)

    return Base58.stringify(cursor.bytes)
  }

  export function format(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

}