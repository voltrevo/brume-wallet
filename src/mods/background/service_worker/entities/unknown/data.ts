import { QueryStorage, createQuery } from "@hazae41/glacier"
import { BgEthereumContext } from "../../context"
import { EthereumChainfulRpcRequestPreinit, EthereumChainlessRpcRequestPreinit } from "../wallets/data"

export namespace BgEthereum {

  export namespace Unknown {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = unknown
    export type F = Error

    export function key(chainId: number, request: EthereumChainlessRpcRequestPreinit<unknown>) {
      return { ...request, chainId }
    }

    export function schema(context: BgEthereumContext, request: EthereumChainlessRpcRequestPreinit<unknown>, storage: QueryStorage) {
      const fetcher = async (request: K, init: RequestInit) =>
        await context.fetchOrThrow<unknown>(request, init)

      return createQuery<K, D, F>({
        key: key(context.chain.chainId, request),
        fetcher,
        storage
      })
    }

  }

}