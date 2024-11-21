import { UniswapV2PoolAbi } from "@/libs/abi/uniswap.abi"
import { UniswapV2 } from "@/libs/uniswap"
import { EthereumChainfulRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { EthereumContext } from "@/mods/universal/context/ethereum"
import { Abi, Fixed, ZeroHexString } from "@hazae41/cubane"
import { createQuery, Data, Fail, QueryStorage } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { Catched } from "@hazae41/result"

export namespace UniswapV2Pool {

  export namespace Price {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = Fixed.From
    export type F = Error

    export function keyOrThrow(chainId: number, pool: UniswapV2.SimpleUniswapV2PoolData, block: string) {
      return {
        chainId: chainId,
        method: "eth_call",
        params: [{
          to: pool.address,
          data: Abi.encodeOrThrow(UniswapV2PoolAbi.getReserves.fromOrThrow())
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pool: Nullable<UniswapV2.SimpleUniswapV2PoolData>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (pool == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit = {}) => {
        try {
          const fetched = await context.fetchOrThrow<ZeroHexString>(request)

          if (fetched.isErr())
            return fetched

          const returns = Abi.Tuple.create(Abi.Uint112, Abi.Uint112, Abi.Uint32)
          const [a, b] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

          const price = UniswapV2.computeOrThrow(pool, [a, b])

          return new Data(price)
        } catch (e: unknown) {
          return new Fail(Catched.wrap(e))
        }
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, pool, block),
        fetcher,
        storage
      })
    }

  }

}