import { Records } from "@/libs/records"
import { EthereumChainfulRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { EthereumContext } from "@/mods/universal/context/ethereum"
import { Fixed, ZeroHexString } from "@hazae41/cubane"
import { createQuery, Data, Fetched, QueryStorage } from "@hazae41/glacier"
import { Nullable, Option } from "@hazae41/option"
import { FactoryV3, UniswapV3Pool } from "../../../uniswap/v3"

export namespace PriceV3 {

  export namespace Native {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = Fixed.From
    export type F = Error

    export function keyOrThrow(chainId: number, block: string) {
      return {
        chainId: chainId,
        method: "eth_getNativeTokenPriceV3",
        params: [block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, init: RequestInit) => Fetched.runOrDoubleWrap(async () => {
        const usdcWethPoolAddress = Records.getOrThrow(FactoryV3.usdcWethPoolByChainId, context.chain.chainId)
        const usdcWethPriceFetched = await UniswapV3Pool.Price.queryOrThrow(context, usdcWethPoolAddress, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (usdcWethPriceFetched.isErr())
          return usdcWethPriceFetched

        return new Data(usdcWethPriceFetched.get())
      })

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, block),
        fetcher,
        storage
      })
    }

  }

  export namespace Contract {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = Fixed.From
    export type F = Error

    export function keyOrThrow(chainId: number, contract: ZeroHexString, block: string) {
      return {
        chainId: chainId,
        method: "eth_getContractTokenPriceV3",
        params: [contract, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, contract: Nullable<ZeroHexString>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (contract == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, init: RequestInit) => Fetched.runOrDoubleWrap(async () => {
        const usdcAddress = Records.getOrThrow(FactoryV3.usdcByChainId, context.chain.chainId)
        const usdcTokenPairFetched = await FactoryV3.GetPool.queryOrThrow(context, contract, usdcAddress, 3000, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (usdcTokenPairFetched.isErr())
          return usdcTokenPairFetched

        if (usdcTokenPairFetched.get().toString() !== "0x0000000000000000000000000000000000000000") {
          const usdcTokenPriceFetched = await UniswapV3Pool.Price.queryOrThrow(context, usdcTokenPairFetched.get(), block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

          if (usdcTokenPriceFetched.isErr())
            return usdcTokenPriceFetched

          return new Data(usdcTokenPriceFetched.get())
        }

        const wethAddress = Records.getOrThrow(FactoryV3.wethByChainId, context.chain.chainId)
        const wethTokenPairFetched = await FactoryV3.GetPool.queryOrThrow(context, contract, wethAddress, 3000, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (wethTokenPairFetched.isErr())
          return wethTokenPairFetched

        const wethTokenPriceFetched = await UniswapV3Pool.Price.queryOrThrow(context, wethTokenPairFetched.get(), block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (wethTokenPriceFetched.isErr())
          return wethTokenPriceFetched

        const usdcWethPoolAddress = Records.getOrThrow(FactoryV3.usdcWethPoolByChainId, context.chain.chainId)
        const usdcWethPriceFetched = await UniswapV3Pool.Price.queryOrThrow(context, usdcWethPoolAddress, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (usdcWethPriceFetched.isErr())
          return usdcWethPriceFetched

        const wethTokenPrice = Fixed.from(wethTokenPriceFetched.get())
        const usdcWethPrice = Fixed.from(usdcWethPriceFetched.get())

        const usdcTokenPrice = wethTokenPrice.mul(usdcWethPrice)

        return new Data(usdcTokenPrice)
      })

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, contract, block),
        fetcher,
        storage
      })
    }

  }

}