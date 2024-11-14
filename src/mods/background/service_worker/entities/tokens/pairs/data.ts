import { PairAbiV2, PairAbiV3 } from "@/libs/abi/pair.abi"
import { PairData } from "@/libs/ethereum/mods/chain"
import { UniswapV2 } from "@/libs/uniswap"
import { Abi, Fixed, ZeroHexString } from "@hazae41/cubane"
import { Data, Fetched, FetcherMore, QueryStorage, createQuery } from "@hazae41/glacier"
import { Option } from "@hazae41/option"
import { Result } from "@hazae41/result"
import { BgEthereumContext } from "../../../context"
import { EthereumQueryKey } from "../../wallets/data"

export namespace BgPairV3 {

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
        const slot0 = await Slot0.queryOrThrow(context, pair, block, storage).refetch().then(r => Option.wrap(r.current).getOrThrow())

        if (slot0.isErr())
          return slot0

        const [sqrtPriceX96] = slot0.get().intoOrThrow()

        return new Data(new Fixed(sqrtPriceX96, 0))
      })

      return createQuery<K, D, F>({
        key: keyOrThrow(pair, block),
        fetcher,
        storage
      })
    }

  }

  export namespace Slot0 {

    export type K = EthereumQueryKey<unknown>
    export type D = Abi.Tuple.Instance<readonly [typeof Abi.Uint160, typeof Abi.Uint160, typeof Abi.Uint32, typeof Abi.Uint32, typeof Abi.Uint32, typeof Abi.Uint32]>
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
        const decoded = Abi.decodeOrThrow(returns, fetched.get())

        return new Data(decoded)
      })


      return createQuery<K, D, F>({
        key: keyOrThrow(pair, block),
        fetcher,
        storage
      })

    }

  }
}

export namespace BgPair {

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