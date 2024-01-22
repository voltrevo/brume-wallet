import { PairAbi } from "@/libs/abi/pair.abi"
import { PairData, tokenByAddress } from "@/libs/ethereum/mods/chain"
import { Abi, Fixed, ZeroHexString } from "@hazae41/cubane"
import { Data, Fail, Fetched, FetcherMore, IDBStorage, createQuery } from "@hazae41/glacier"
import { Catched, Result } from "@hazae41/result"
import { BgEthereumContext } from "../../../context"
import { EthereumQueryKey } from "../../wallets/data"

export namespace BgPair {

  export namespace Price {

    export type Key = EthereumQueryKey<unknown>
    export type Data = Fixed.From
    export type Fail = Error

    export function key(pair: PairData, block: string) {
      return Result.runAndWrapSync(() => ({
        chainId: pair.chainId,
        method: "eth_call",
        params: [{
          to: pair.address,
          data: Abi.encodeOrThrow(PairAbi.getReserves.from())
        }, block]
      })).ok().inner
    }

    export function schema(ethereum: BgEthereumContext, pair: PairData, block: string, storage: IDBStorage) {
      const maybeKey = key(pair, block)

      if (maybeKey == null)
        return

      const fetcher = (request: Key, more: FetcherMore) => Fetched.runOrDoubleWrap(async () => {
        try {
          const fetched = await BgEthereumContext.fetchOrFail<ZeroHexString>(ethereum, request, more)

          if (fetched.isErr())
            return fetched

          const returns = Abi.Tuple.create(Abi.Uint112, Abi.Uint112, Abi.Uint32)
          const [a, b] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

          const price = computeOrThrow(pair, [a, b])

          return new Data(price)
        } catch (e: unknown) {
          return new Fail(Catched.from(e))
        }
      })

      return createQuery<Key, Data, Fail>({
        key: maybeKey,
        fetcher,
        storage
      })
    }

    export function computeOrThrow(pair: PairData, reserves: [bigint, bigint]) {
      const decimals0 = tokenByAddress[pair.token0].decimals
      const decimals1 = tokenByAddress[pair.token1].decimals

      const [reserve0, reserve1] = reserves

      const quantity0 = new Fixed(reserve0, decimals0)
      const quantity1 = new Fixed(reserve1, decimals1)

      if (pair.reversed)
        return quantity0.div(quantity1)

      return quantity1.div(quantity0)
    }

  }

}