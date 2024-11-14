import { PairAbiV2, PairAbiV3 } from "@/libs/abi/pair.abi"
import { PairData } from "@/libs/ethereum/mods/chain"
import { UniswapV2, UniswapV3 } from "@/libs/uniswap"
import { Abi, Fixed, ZeroHexString } from "@hazae41/cubane"
import { Data, Fetched, FetcherMore, QueryStorage, States, createQuery } from "@hazae41/glacier"
import { Option, Some } from "@hazae41/option"
import { Result } from "@hazae41/result"
import { BgEthereumContext } from "../../../context"
import { EthereumQueryKey } from "../../wallets/data"

export namespace BgPairV3 {

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

    export function queryOrThrow(context: BgEthereumContext, pair: PairData, block: string, storage: QueryStorage) {
      const fetcher = (request: K, more: FetcherMore) => Fetched.runOrDoubleWrap(async () => {
        const sqrtPriceX96 = await SqrtPriceX96.queryOrThrow(context, pair, block, storage).refetch().then(r => Option.wrap(r.real?.current).getOrThrow())

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

    export function queryOrThrow(context: BgEthereumContext, pair: PairData, block: string, storage: QueryStorage) {
      const fetcher = (request: K, more: FetcherMore) => Fetched.runOrDoubleWrap(async () => {
        const slot0 = await Slot0.queryOrThrow(context, pair, block, storage).refetch().then(r => Option.wrap(r.real?.current).getOrThrow())

        if (slot0.isErr())
          return slot0

        const [sqrtPriceX96] = slot0.get()

        return new Data(sqrtPriceX96, slot0)
      })

      const indexer = async (states: States<D, F>) => {
        const { current } = states

        const maybeCurrentData = current.real?.current.checkOrNull()

        await Price.queryOrThrow(context, pair, block, storage).mutate(() => {
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

    export function queryOrThrow(context: BgEthereumContext, pair: PairData, block: string, storage: QueryStorage) {
      const fetcher = (request: K, more: FetcherMore) => Fetched.runOrDoubleWrap(async () => {
        const fetched = await BgEthereumContext.fetchOrFail<ZeroHexString>(context, request, more)

        if (fetched.isErr())
          return fetched

        const returns = Abi.Tuple.create(Abi.Uint160, Abi.Uint160, Abi.Uint32, Abi.Uint32, Abi.Uint32, Abi.Uint32)
        const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow().map(x => new Fixed(x, 0))

        return new Data(decoded as unknown as D)
      })

      const indexer = async (states: States<D, F>) => {
        const { current } = states

        const maybeCurrentData = current.real?.current.checkOrNull()

        await SqrtPriceX96.queryOrThrow(context, pair, block, storage).mutate(() => {
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

export namespace BgPairV2 {

  export namespace Price {

    export type K = EthereumQueryKey<unknown>
    export type D = Fixed.From
    export type F = Error

    export function key(pair: PairData, block: string) {
      return Result.runAndWrapSync(() => ({
        chainId: pair.chainId,
        method: "eth_call",
        params: [{
          to: pair.address,
          data: Abi.encodeOrThrow(PairAbiV2.getReserves.fromOrThrow())
        }, block]
      })).ok().getOrNull()
    }

    export function schema(context: BgEthereumContext, pair: PairData, block: string, storage: QueryStorage) {
      const maybeKey = key(pair, block)

      if (maybeKey == null)
        return

      const fetcher = (request: K, more: FetcherMore) => Fetched.runOrDoubleWrap(async () => {
        const fetched = await BgEthereumContext.fetchOrFail<ZeroHexString>(context, request, more)

        if (fetched.isErr())
          return fetched

        const returns = Abi.Tuple.create(Abi.Uint112, Abi.Uint112, Abi.Uint32)
        const [a, b] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

        const price = UniswapV2.computeOrThrow(pair, [a, b])

        return new Data(price)
      })

      return createQuery<K, D, F>({
        key: maybeKey,
        fetcher,
        storage
      })
    }

  }

}