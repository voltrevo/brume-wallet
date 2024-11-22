import { ZeroHexBigInt } from "@/libs/bigints/bigints"
import { Records } from "@/libs/records"
import { EthereumChainfulRpcRequestPreinit, EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { EthereumContext } from "@/mods/universal/context/ethereum"
import { Fixed, ZeroHexString } from "@hazae41/cubane"
import { createQuery, Data, JsonRequest, QueryStorage } from "@hazae41/glacier"
import { Nullable, Option } from "@hazae41/option"
import { FactoryV3, UniswapV3Pool } from "../../../uniswap/v3"

export namespace Price {

  export namespace Native {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = Fixed.From
    export type F = Error

    export function keyOrThrow(chainId: number, block: string) {
      const body = {
        method: "eth_getNativeTokenPrice",
        params: [block]
      } as const

      return new JsonRequest(`/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (block == null)
        return

      const fetcher = async (_: K, init: RequestInit) => {
        const usdcAddress = Records.getOrThrow(FactoryV3.usdcByChainId, context.chain.chainId)
        const usdcWethPoolAddress = Records.getOrThrow(FactoryV3.usdcWethPoolByChainId, context.chain.chainId)

        const usdcWethPoolToken0Fetched = await UniswapV3Pool.Token0.queryOrThrow(context, usdcWethPoolAddress, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (usdcWethPoolToken0Fetched.isErr())
          return usdcWethPoolToken0Fetched

        const usdcWethPriceFetched = await UniswapV3Pool.Price.queryOrThrow(context, usdcWethPoolAddress, block, storage)!.fetchOrThrow(init).then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (usdcWethPriceFetched.isErr())
          return usdcWethPriceFetched

        const [usdWethRecto, usdcWethVerso] = usdcWethPriceFetched.get()

        return new Data(usdcWethPoolToken0Fetched.get() === usdcAddress ? usdWethRecto : usdcWethVerso)
      }

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
        method: "eth_getContractTokenPrice",
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

      const fetcher = async (request: K, init: RequestInit) => {
        const usdcAddress = Records.getOrThrow(FactoryV3.usdcByChainId, context.chain.chainId)

        const usdcTokenPoolFetched = await FactoryV3.GetPool.queryOrThrow(context, contract, usdcAddress, 3000, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (usdcTokenPoolFetched.isErr())
          return usdcTokenPoolFetched

        if (usdcTokenPoolFetched.get().toString() !== "0x0000000000000000000000000000000000000000") {
          const usdcTokenLiquidityFetched = await UniswapV3Pool.Liquidity.queryOrThrow(context, usdcTokenPoolFetched.get(), block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

          if (usdcTokenLiquidityFetched.isErr())
            return usdcTokenLiquidityFetched

          const usdcTokenLiquidityZeroHex = ZeroHexBigInt.from(usdcTokenLiquidityFetched.get())
          const usdcTokenLiquidityFixed = new Fixed(usdcTokenLiquidityZeroHex.value, 6)
          const usdcTokenLiquidityFloat = Number(usdcTokenLiquidityFixed.toString())

          if (usdcTokenLiquidityFloat > (10 ** 4)) {
            const usdcTokenToken0Fetched = await UniswapV3Pool.Token0.queryOrThrow(context, usdcTokenPoolFetched.get(), block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

            if (usdcTokenToken0Fetched.isErr())
              return usdcTokenToken0Fetched

            const usdcTokenPriceFetched = await UniswapV3Pool.Price.queryOrThrow(context, usdcTokenPoolFetched.get(), block, storage)!.fetchOrThrow(init).then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

            if (usdcTokenPriceFetched.isErr())
              return usdcTokenPriceFetched

            const [usdcTokenRecto, usdcTokenVerso] = usdcTokenPriceFetched.get()

            return new Data(usdcTokenToken0Fetched.get() === usdcAddress ? usdcTokenRecto : usdcTokenVerso)
          }
        }

        const wethAddress = Records.getOrThrow(FactoryV3.wethByChainId, context.chain.chainId)
        const usdcWethPoolAddress = Records.getOrThrow(FactoryV3.usdcWethPoolByChainId, context.chain.chainId)

        const wethTokenPoolFetched = await FactoryV3.GetPool.queryOrThrow(context, contract, wethAddress, 3000, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (wethTokenPoolFetched.isErr())
          return wethTokenPoolFetched

        const wethTokenToken0Fetched = await UniswapV3Pool.Token0.queryOrThrow(context, wethTokenPoolFetched.get(), block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (wethTokenToken0Fetched.isErr())
          return wethTokenToken0Fetched

        const wethTokenPriceFetched = await UniswapV3Pool.Price.queryOrThrow(context, wethTokenPoolFetched.get(), block, storage)!.fetchOrThrow(init).then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (wethTokenPriceFetched.isErr())
          return wethTokenPriceFetched

        const usdcWethToken0Fetched = await UniswapV3Pool.Token0.queryOrThrow(context, usdcWethPoolAddress, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (usdcWethToken0Fetched.isErr())
          return usdcWethToken0Fetched

        const usdcWethPriceFetched = await UniswapV3Pool.Price.queryOrThrow(context, usdcWethPoolAddress, block, storage)!.fetchOrThrow(init).then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (usdcWethPriceFetched.isErr())
          return usdcWethPriceFetched

        const [wethTokenRecto, wethTokenVerso] = wethTokenPriceFetched.get()
        const [usdcWethRecto, usdcWethVerso] = usdcWethPriceFetched.get()

        const wethTokenPrice = Fixed.from(wethTokenToken0Fetched.get() === wethAddress ? wethTokenRecto : wethTokenVerso)
        const usdcWethPrice = Fixed.from(usdcWethToken0Fetched.get() === usdcAddress ? usdcWethRecto : usdcWethVerso)

        const usdcTokenPrice = wethTokenPrice.mul(usdcWethPrice)

        return new Data(usdcTokenPrice)
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, contract, block),
        fetcher,
        storage
      })
    }

  }

}