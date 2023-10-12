import { Base16 } from "@hazae41/base16"
import { Box, Copied } from "@hazae41/box"
import { Bytes } from "@hazae41/bytes"
import { Ok, Result } from "@hazae41/result"

export interface SignatureInit {
  readonly v: number
  readonly r: Bytes<32>
  readonly s: Bytes<32>
}

namespace Hex {

  export function pad(text: string) {
    return text.padStart(text.length + (text.length % 2), "0")
  }

}

export namespace Signature {

  export function tryFrom(init: SignatureInit): Result<string, Error> {
    return Result.unthrowSync(t => {
      const { v, r, s } = init

      const hv = Hex.pad(v.toString(16))
      const hr = Base16.get().tryEncode(new Box(new Copied(r))).throw(t)
      const hs = Base16.get().tryEncode(new Box(new Copied(s))).throw(t)

      return new Ok(`0x${hr}${hs}${hv}`)
    })
  }

}