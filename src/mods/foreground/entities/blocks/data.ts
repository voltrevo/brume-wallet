import { Errors } from "@/libs/errors/errors"
import { ChainData } from "@/libs/ethereum/mods/chain"
import { EthereumChainfulRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { ZeroHexString } from "@hazae41/cubane"
import { createQuery, useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { UserStorage, useUserStorageContext } from "../../storage/user"
import { FgEthereumContext } from "../wallets/data"

export interface BlockData {
  readonly baseFeePerGas?: ZeroHexString
}

export namespace FgBlock {

  export namespace ByNumber {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = BlockData
    export type F = Error

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

      const fetcher = async (request: K) =>
        await context.fetchOrFail<BlockData>(request)

      return createQuery<K, D, F>({
        key: key(context.chain, number),
        fetcher,
        storage,
      })
    }

  }

}

export function useBlockByNumber(number: Nullable<string>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgBlock.ByNumber.schema, [number, context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)

  useError(query, Errors.onQueryError)
  return query
}
