import { Base16 } from "@hazae41/base16"
import { Box } from "@hazae41/box"
import { Bytes } from "@hazae41/bytes"
import { ZeroHexString } from "@hazae41/cubane"
import { Copiable, Copied, Keccak256 } from "@hazae41/keccak256"
import * as Uts46 from "idna-uts46-hx"

export class Slot<T extends Disposable> implements Disposable {

  constructor(
    public inner: T
  ) { }

  [Symbol.dispose]() {
    this.inner[Symbol.dispose]()
  }

}

export namespace Ens {

  export function namehash(name: string): ZeroHexString {
    if (name.length === 0)
      return "0x".padEnd(2 + 32, "0") as ZeroHexString

    const uts46 = Uts46.toUnicode(name, { useStd3ASCII: true })
    const labels = uts46.split('.').reverse()

    using node: Slot<Box<Copiable>> = new Slot(new Box(new Copied(new Uint8Array(32))))

    for (const label of labels) {
      using previous = node.inner.unwrap()
      using hashed = Keccak256.get().tryHash(Bytes.fromUtf8(label)).unwrap()

      const concat = Bytes.concat([previous.bytes, hashed.bytes])
      node.inner = new Box(Keccak256.get().tryHash(concat).unwrap())
    }

    return "0x" + Base16.get().tryEncode(node.inner.unwrap().bytes).unwrap() as ZeroHexString
  }

}