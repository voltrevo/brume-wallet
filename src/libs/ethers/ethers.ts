import { Result } from "@hazae41/result"
import { ethers } from "ethers"

export namespace Ethers {

  export namespace Wallet {

    export function tryRandom() {
      return Result.catchAndWrapSync(() => ethers.Wallet.createRandom())
    }

    export function tryFrom(privateKey: string) {
      return Result.catchAndWrapSync(() => new ethers.Wallet(privateKey))
    }

  }

}