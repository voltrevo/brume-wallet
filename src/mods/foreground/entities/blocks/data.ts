import { Errors } from "@/libs/errors/errors"
import { ChainData } from "@/libs/ethereum/mods/chain"
import { EthereumFetchParams, EthereumQueryKey } from "@/mods/background/service_worker/entities/wallets/data"
import { ZeroHexString } from "@hazae41/cubane"
import { createQuery, useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { Nullable } from "@hazae41/option"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorageContext } from "../../storage/user"
import { FgEthereumContext, fetchOrFail } from "../wallets/data"

export interface BlockData {
  readonly baseFeePerGas?: ZeroHexString
}

export namespace FgBlock {

  export namespace ByNumber {

    export type Key = EthereumQueryKey<unknown> & EthereumFetchParams
    export type Data = BlockData
    export type Fail = Error

    export function key(chain: ChainData, number: string) {
      return {
        chainId: chain.chainId,
        method: "eth_getBlockByNumber",
        params: [number, false],
        noCheck: true
      }
    }

    export function schema(number: Nullable<string>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (number == null)
        return

      const fetcher = async (request: RpcRequestPreinit<unknown>) =>
        await fetchOrFail<BlockData>(request, context)

      return createQuery<Key, Data, Fail>({
        key: key(context.chain, number),
        fetcher,
        storage,
      })
    }

  }

}

export function useBlockByNumber(number: Nullable<string>, ethereum: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgBlock.ByNumber.schema, [number, ethereum, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}
