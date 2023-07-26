import { Bytes } from "@hazae41/bytes"

export interface SignatureInit {
  readonly v: number
  readonly r: Uint8Array
  readonly s: Uint8Array
}

export namespace Signature {

  export function from(init: SignatureInit) {
    const { v, r, s } = init

    const hv = (v - 27).toString(16).padStart(2, "0")
    const hr = Bytes.toHex(r)
    const hs = Bytes.toHex(s)

    return `0x${hr}${hs}${hv}`
  }

}