import "@hazae41/symbol-dispose-polyfill"

import { Cubane } from "@hazae41/cubane"
import { Keccak256 } from "@hazae41/keccak256"
import { Sha3Wasm } from "@hazae41/sha3.wasm"

export function $parse$(signature: string): any {
  return (async () => {
    await Sha3Wasm.initBundled()

    Keccak256.set(Keccak256.fromWasm(Sha3Wasm))

    return Cubane.Abi.FunctionSignature.$parse$(signature)
  })() as any
}