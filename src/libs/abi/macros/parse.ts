import "@hazae41/symbol-dispose-polyfill"

import { WalletWasm } from "@brumewallet/wallet.wasm"
import { Cubane } from "@hazae41/cubane"
import { Keccak256 } from "@hazae41/keccak256"

export function $parse$(signature: string): any {
  return (async () => {
    await WalletWasm.initBundled()

    Keccak256.set(Keccak256.fromWasm(WalletWasm))

    return Cubane.Abi.FunctionSignature.$parse$(signature)
  })() as any
}