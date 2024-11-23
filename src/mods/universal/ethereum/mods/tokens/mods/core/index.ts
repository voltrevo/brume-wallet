import { TokenRef } from "@/mods/background/service_worker/entities/tokens/data";
import { EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data";
import { createQuery, JsonRequest, QueryStorage } from "@hazae41/glacier";

export namespace All {

  export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
  export type D = TokenRef[]
  export type F = never

  export function keyOrThrow() {
    const body = {
      method: "eth_getAllTokens"
    } as const

    return new JsonRequest(`app:/ethereum`, { method: "POST", body })
  }

  export function queryOrThrow(storage: QueryStorage) {
    return createQuery({ key: keyOrThrow(), storage })
  }

}