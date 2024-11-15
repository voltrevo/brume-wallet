import { PairAbiV3 } from "@/libs/abi/pair.abi"
import { PairData } from "@/libs/ethereum/mods/chain"
import { UniswapV3 } from "@/libs/uniswap"
import { EthereumQueryKey } from "@/mods/background/service_worker/entities/wallets/data"
import { Abi, Fixed, ZeroHexString } from "@hazae41/cubane"
import { createQuery, Data, Fetched, FetcherMore, QueryStorage, States } from "@hazae41/glacier"
import { Nullable, Option, Some } from "@hazae41/option"
import { EthereumContext } from "../../../context/ethereum"

export namespace FactoryV3 {

  export namespace GetPool {


  }

}

export namespace PairV3 {

  export namespace Price {

    export type K = EthereumQueryKey<unknown>
    export type D = Fixed.From
    export type F = Error

    export function keyOrThrow(pair: PairData, block: string) {
      return {
        chainId: pair.chainId,
        method: "eth_get",
        params: [{
          to: pair.address,
          data: "price"
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pair: Nullable<PairData>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (pair == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, more: FetcherMore) => Fetched.runOrDoubleWrap(async () => {
        const sqrtPriceX96 = await SqrtPriceX96.queryOrThrow(context, pair, block, storage)!.refetch().then(r => Option.wrap(r.real?.current).getOrThrow())

        if (sqrtPriceX96.isErr())
          return sqrtPriceX96

        return new Data(UniswapV3.computeOrThrow(pair, sqrtPriceX96.get()), sqrtPriceX96)
      })

      return createQuery<K, D, F>({
        key: keyOrThrow(pair, block),
        fetcher,
        storage
      })
    }
  }

  export namespace SqrtPriceX96 {

    export type K = EthereumQueryKey<unknown>
    export type D = Fixed.From<0>
    export type F = Error

    export function keyOrThrow(pair: PairData, block: string) {
      return {
        chainId: pair.chainId,
        method: "eth_get",
        params: [{
          to: pair.address,
          data: "sqrtPriceX96"
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pair: Nullable<PairData>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (pair == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, more: FetcherMore) => Fetched.runOrDoubleWrap(async () => {
        const slot0 = await Slot0.queryOrThrow(context, pair, block, storage)!.refetch().then(r => Option.wrap(r.real?.current).getOrThrow())

        if (slot0.isErr())
          return slot0

        const [sqrtPriceX96] = slot0.get()

        return new Data(sqrtPriceX96, slot0)
      })

      const indexer = async (states: States<D, F>) => {
        const { current } = states

        const maybeCurrentData = current.real?.current.checkOrNull()

        await Price.queryOrThrow(context, pair, block, storage)?.mutate(() => {
          if (maybeCurrentData == null)
            return new Some(undefined)

          const price = UniswapV3.computeOrThrow(pair, maybeCurrentData.get())

          return new Some(new Data(price, maybeCurrentData))
        })
      }


      return createQuery<K, D, F>({
        key: keyOrThrow(pair, block),
        fetcher,
        indexer,
        storage
      })
    }

  }

  export namespace Slot0 {

    export type K = EthereumQueryKey<unknown>
    export type D = readonly [Fixed.From<0>, Fixed.From<0>, Fixed.From<0>, Fixed.From<0>, Fixed.From<0>, Fixed.From<0>]
    export type F = Error

    export function keyOrThrow(pair: PairData, block: string) {
      return {
        chainId: pair.chainId,
        method: "eth_call",
        params: [{
          to: pair.address,
          data: Abi.encodeOrThrow(PairAbiV3.slot0.fromOrThrow())
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pair: Nullable<PairData>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (pair == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, more: FetcherMore) => Fetched.runOrDoubleWrap(async () => {
        const fetched = await context.fetchOrFail<ZeroHexString>(request, more)

        if (fetched.isErr())
          return fetched

        const returns = Abi.Tuple.create(Abi.Uint160, Abi.Uint160, Abi.Uint32, Abi.Uint32, Abi.Uint32, Abi.Uint32)
        const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow().map(x => new Fixed(x, 0))

        return new Data(decoded as unknown as D)
      })

      const indexer = async (states: States<D, F>) => {
        const { current } = states

        const maybeCurrentData = current.real?.current.checkOrNull()

        await SqrtPriceX96.queryOrThrow(context, pair, block, storage)?.mutate(() => {
          if (maybeCurrentData == null)
            return new Some(undefined)

          const [sqrtPriceX96] = maybeCurrentData.get()

          return new Some(new Data(sqrtPriceX96, maybeCurrentData))
        })
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(pair, block),
        fetcher,
        indexer,
        storage
      })

    }

  }
}