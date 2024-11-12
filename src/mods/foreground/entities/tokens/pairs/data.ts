import { Errors } from "@/libs/errors/errors"
import { PairData } from "@/libs/ethereum/mods/chain"
import { UniswapV2 } from "@/libs/uniswap"
import { BgPair } from "@/mods/background/service_worker/entities/tokens/pairs/data"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { Abi, ZeroHexString } from "@hazae41/cubane"
import { Data, Fail, FetcherMore, createQuery, useError, useFetch, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { Catched } from "@hazae41/result"
import { FgEthereumContext, fetchOrFail } from "../../wallets/data"

export namespace FgPair {

  export namespace Price {

    export type K = BgPair.Price.K
    export type D = BgPair.Price.D
    export type F = BgPair.Price.F

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

      const fetcher = async (request: K, more: FetcherMore = {}) => {
        try {
          const fetched = await fetchOrFail<ZeroHexString>(request, context)

          if (fetched.isErr())
            return fetched

          const returns = Abi.Tuple.create(Abi.Uint112, Abi.Uint112, Abi.Uint32)
          const [a, b] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

          const price = UniswapV2.computeOrThrow(pair, [a, b])

          return new Data(price)
        } catch (e: unknown) {
          return new Fail(Catched.wrap(e))
        }
      }

      return createQuery<K, D, F>({
        key: maybeKey,
        fetcher,
        storage
      })
    }

  }

}

export function usePairPrice(pair: Nullable<PairData>, block: Nullable<string>, context: Nullable<FgEthereumContext>,) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgPair.Price.schema, [pair, block, context, storage])
  useFetch(query)
  useVisible(query)

  useError(query, Errors.onQueryError)
  return query
}
