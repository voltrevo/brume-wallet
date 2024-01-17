import { Errors } from "@/libs/errors/errors"
import { PairData } from "@/libs/ethereum/mods/chain"
import { BgPair } from "@/mods/background/service_worker/entities/tokens/pairs/data"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { Abi, ZeroHexString } from "@hazae41/cubane"
import { Data, Fail, FetcherMore, createQuery, useError, useFetch, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { Catched } from "@hazae41/result"
import { FgEthereumContext, fetchOrFail2 } from "../../wallets/data"

export namespace FgPair {

  export namespace Price {

    export type Key = BgPair.Price.Key
    export type Data = BgPair.Price.Data
    export type Fail = BgPair.Price.Fail

    export const key = BgPair.Price.key

    export function schema(pair: Nullable<PairData>, block: Nullable<string>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (pair == null)
        return
      if (block == null)
        return

      const maybeKey = key(pair, block)

      if (maybeKey == null)
        return

      const fetcher = async (request: Key, more: FetcherMore = {}) => {
        try {
          const fetched = await fetchOrFail2<ZeroHexString>(request, context)

          if (fetched.isErr())
            return fetched

          const returns = Abi.createTuple(Abi.Uint112, Abi.Uint112, Abi.Uint32)
          const [a, b] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

          const price = BgPair.Price.computeOrThrow(pair, [a, b])

          return new Data(price)
        } catch (e: unknown) {
          return new Fail(Catched.from(e))
        }
      }

      return createQuery<Key, Data, Fail>({
        key: maybeKey,
        fetcher,
        storage
      })
    }

  }

}

export function usePairPrice(pair: Nullable<PairData>, block: Nullable<string>, context: Nullable<FgEthereumContext>,) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgPair.Price.schema, [pair, block, context, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}
