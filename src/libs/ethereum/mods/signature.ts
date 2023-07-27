import { Bytes } from "@hazae41/bytes"

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

  export function from(init: SignatureInit) {
    const { v, r, s } = init

    const hv = Hex.pad(v.toString(16))
    const hr = Bytes.toHex(r)
    const hs = Bytes.toHex(s)

    return `0x${hr}${hs}${hv}`
  }

}