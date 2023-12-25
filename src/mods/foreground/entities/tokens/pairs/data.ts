import { Errors } from "@/libs/errors/errors"
import { PairData } from "@/libs/ethereum/mods/chain"
import { BgPair } from "@/mods/background/service_worker/entities/tokens/pairs/data"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { Fixed } from "@hazae41/cubane"
import { FetcherMore, createQuery, useError, useFetch, useQuery, useVisible } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { Nullable } from "@hazae41/option"
import { FgEthereumContext, fetchOrFail } from "../../wallets/data"

export namespace FgPair {

  export namespace Price {

    export type Key = BgPair.Price.Key
    export type Data = BgPair.Price.Data
    export type Fail = BgPair.Price.Fail

    export const key = BgPair.Price.key

    export function schema(context: Nullable<FgEthereumContext>, pair: PairData, storage: UserStorage) {
      if (context == null)
        return

      const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
        await fetchOrFail<Fixed.From>(request, context)

      return createQuery<Key, Data, Fail>({
        key: key(pair),
        fetcher,
        storage
      })
    }

  }

}

export function usePairPrice(ethereum: Nullable<FgEthereumContext>, pair: PairData) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgPair.Price.schema, [ethereum, pair, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}
