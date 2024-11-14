import { PairAbiV2, PairAbiV3 } from "@/libs/abi/pair.abi"
import { PairData } from "@/libs/ethereum/mods/chain"
import { UniswapV2 } from "@/libs/uniswap"
import { Abi, Fixed, ZeroHexString } from "@hazae41/cubane"
import { Data, Fail, Fetched, FetcherMore, QueryStorage, createQuery } from "@hazae41/glacier"
import { Catched, Result } from "@hazae41/result"
import { BgEthereumContext } from "../../../context"
import { EthereumQueryKey } from "../../wallets/data"

export namespace BgPairV3 {

  export namespace SqrtPriceX96 {

    export type K = EthereumQueryKey<unknown>
    export type D = Fixed.From
    export type F = Error

    export function key(pair: PairData, block: string) {
      return Result.runAndWrapSync(() => ({
        chainId: pair.chainId,
        method: "eth_call",
        params: [{
          to: pair.address,
          data: Abi.encodeOrThrow(PairAbiV3.slot0.fromOrThrow())
        }, block]
      })).ok().getOrNull()
    }

    export function schema(context: BgEthereumContext, pair: PairData, block: string, storage: QueryStorage) {
      const maybeKey = key(pair, block)

      if (maybeKey == null)
        return

      const fetcher = (request: K, more: FetcherMore) => Fetched.runOrDoubleWrap(async () => {
        try {
          const fetched = await BgEthereumContext.fetchOrFail<ZeroHexString>(context, request, more)

          if (fetched.isErr())
            return fetched

          const returns = Abi.Tuple.create(Abi.Uint160, Abi.Uint160, Abi.Uint32, Abi.Uint32, Abi.Uint32, Abi.Uint32)
          const [a, b, c, d, e, f] = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

          return new Data(new Fixed(a, 0))
        } catch (e: unknown) {
          return new Fail(Catched.wrap(e))
        }
      })

      return createQuery<K, D, F>({
        key: maybeKey,
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
        try {
          const fetched = await BgEthereumContext.fetchOrFail<ZeroHexString>(context, request, more)

          if (fetched.isErr())
            return fetched

          const returns = Abi.Tuple.create(Abi.Uint112, Abi.Uint112, Abi.Uint32)
          const [a, b] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

          const price = UniswapV2.computeOrThrow(pair, [a, b])

          return new Data(price)
        } catch (e: unknown) {
          return new Fail(Catched.wrap(e))
        }
      })

      return createQuery<K, D, F>({
        key: maybeKey,
        fetcher,
        storage
      })
    }

  }

}