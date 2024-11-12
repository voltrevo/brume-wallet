import { PairAbi } from "@/libs/abi/pair.abi"
import { PairData } from "@/libs/ethereum/mods/chain"
import { UniswapV2 } from "@/libs/uniswap"
import { Abi, Fixed, ZeroHexString } from "@hazae41/cubane"
import { Data, Fail, Fetched, FetcherMore, QueryStorage, createQuery } from "@hazae41/glacier"
import { Catched, Result } from "@hazae41/result"
import { BgEthereumContext } from "../../../context"
import { EthereumQueryKey } from "../../wallets/data"

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
          data: Abi.encodeOrThrow(PairAbi.getReserves.fromOrThrow())
        }, block]
      })).ok().inner
    }

    export function schema(ethereum: BgEthereumContext, pair: PairData, block: string, storage: QueryStorage) {
      const maybeKey = key(pair, block)

      if (maybeKey == null)
        return

      const fetcher = (request: K, more: FetcherMore) => Fetched.runOrDoubleWrap(async () => {
        try {
          const fetched = await BgEthereumContext.fetchOrFail<ZeroHexString>(ethereum, request, more)

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