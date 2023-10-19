import { IDBStorage, createQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { EthereumContext, EthereumFetchParams, EthereumQueryKey, tryEthereumFetch } from "../wallets/data"

export namespace BgUnknown {

  export function key(chainId: number, request: RpcRequestPreinit<unknown>) {
    const { method, params } = request
    return { chainId, method, params }
  }

  export function schema(ethereum: EthereumContext, request: RpcRequestPreinit<unknown> & EthereumFetchParams, storage: IDBStorage) {
    const fetcher = async (request: EthereumQueryKey<unknown>) =>
      await tryEthereumFetch<unknown>(ethereum, request)

    return createQuery<EthereumQueryKey<unknown>, any, Error>({
      key: key(ethereum.chain.chainId, request),
      fetcher,
      storage
    })
  }

}