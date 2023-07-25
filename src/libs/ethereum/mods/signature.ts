import { Bytes } from "@hazae41/bytes"

export interface SignatureInit {
  readonly v: number
  readonly r: Uint8Array
  readonly s: Uint8Array
}

export namespace Signature {

  export function from(init: SignatureInit) {
    const v = (init.v - 27).toString(16).padStart(2, "0")
    const r = Bytes.toHex(init.r)
    const s = Bytes.toHex(init.s)
    return `0x${r}${s}${v}`
  }

}