import { RankingAbi, RegistryAbi } from "@/libs/abi/contest.abi"
import { EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { Abi, Address } from "@hazae41/cubane"
import { JsonRequest } from "@hazae41/glacier"
import { BlockNumber } from "../../../blocks"

export namespace Contest {

  export namespace AddressOf {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = Address
    export type F = Error

    export function keyOrThrow(chainId: 1, rank: number, block: BlockNumber) {
      const body = {
        method: "eth_call",
        params: [{
          to: "0x15ca4c2c6284e3a7DAe8349Cf6B671FF4a12F580",
          data: Abi.encodeOrThrow(RankingAbi.addressOf.fromOrThrow(rank))
        }, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

  }

  export namespace Registry {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = Address
    export type F = Error

    export function keyOrThrow(chainId: 1, address: Address, block: BlockNumber) {
      const body = {
        method: "eth_call",
        params: [{
          to: "0x1e0D64ccbeb42275d6e73EefffA8620056B70bCC",
          data: Abi.encodeOrThrow(RegistryAbi.registry.fromOrThrow(address))
        }, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

  }

}