import { FactoryAbiV3, PairAbiV3 } from "@/libs/abi/pair.abi"
import { SimpleContractTokenData, SimplePairDataV3 } from "@/libs/ethereum/mods/chain"
import { Records } from "@/libs/records"
import { UniswapV3 } from "@/libs/uniswap"
import { EthereumChainfulRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { Abi, Address, Fixed, ZeroHexString } from "@hazae41/cubane"
import { createQuery, Data, Fetched, QueryStorage, States } from "@hazae41/glacier"
import { Nullable, Option, Some } from "@hazae41/option"
import { EthereumContext } from "../../../context/ethereum"

export namespace FactoryV3 {

  export const factoryByChainId = {
    1: {
      chainId: 1,
      address: "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    }
  }

  export const wethByChainId = {
    1: {
      type: "contract",
      decimals: 18,
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    } satisfies SimpleContractTokenData
  }

  export const usdcByChainId = {
    1: {
      type: "contract",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
    } satisfies SimpleContractTokenData
  }

  export const usdcWethPoolByChainId = {
    1: {
      version: 3,
      address: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640",
      chainId: 1,
      token0: usdcByChainId[1],
      token1: wethByChainId[1],
    } satisfies SimplePairDataV3
  }

  export namespace GetPool {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = Address
    export type F = Error

    export function keyOrThrow(chainId: number, token0: SimpleContractTokenData, token1: SimpleContractTokenData, fee: number, block: string) {
      return {
        chainId: chainId,
        method: "eth_call",
        params: [{
          to: Records.getOrThrow(factoryByChainId, chainId).address,
          data: Abi.encodeOrThrow(FactoryAbiV3.getPool.fromOrThrow(token0.address, token1.address, fee))
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, token0: Nullable<SimpleContractTokenData>, token1: Nullable<SimpleContractTokenData>, fee: Nullable<number>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (token0 == null)
        return
      if (token1 == null)
        return
      if (fee == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, more: RequestInit) => Fetched.runOrDoubleWrap(async () => {
        const fetched = await context.fetchOrFail<ZeroHexString>(request, more)

        if (fetched.isErr())
          return fetched

        const returns = Abi.Address
        const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

        return new Data(decoded)
      })

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, token0, token1, fee, block),
        fetcher,
        storage
      })
    }

  }

}

export namespace PairV3 {

  export namespace Price {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = Fixed.From
    export type F = Error

    export function keyOrThrow(pair: SimplePairDataV3, block: string) {
      return {
        chainId: pair.chainId,
        method: "eth_get",
        params: [{
          to: pair.address,
          data: "price"
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pair: Nullable<SimplePairDataV3>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (pair == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, more: RequestInit) => Fetched.runOrDoubleWrap(async () => {
        const sqrtPriceX96 = await SqrtPriceX96.queryOrThrow(context, pair, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

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

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = Fixed.From<0>
    export type F = Error

    export function keyOrThrow(pair: SimplePairDataV3, block: string) {
      return {
        chainId: pair.chainId,
        method: "eth_get",
        params: [{
          to: pair.address,
          data: "sqrtPriceX96"
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pair: Nullable<SimplePairDataV3>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (pair == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, more: RequestInit) => Fetched.runOrDoubleWrap(async () => {
        const slot0 = await Slot0.queryOrThrow(context, pair, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (slot0.isErr())
          return slot0

        const [sqrtPriceX96] = slot0.get()

        return new Data(sqrtPriceX96, slot0)
      })

      const indexer = async (states: States<D, F>) => {
        const { current } = states

        const maybeCurrentData = current.real?.current.checkOrNull()

        await Price.queryOrThrow(context, pair, block, storage)?.mutateOrThrow(() => {
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

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = readonly [Fixed.From<0>, Fixed.From<0>, Fixed.From<0>, Fixed.From<0>, Fixed.From<0>, Fixed.From<0>]
    export type F = Error

    export function keyOrThrow(pair: SimplePairDataV3, block: string) {
      return {
        chainId: pair.chainId,
        method: "eth_call",
        params: [{
          to: pair.address,
          data: Abi.encodeOrThrow(PairAbiV3.slot0.fromOrThrow())
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pair: Nullable<SimplePairDataV3>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (pair == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, more: RequestInit) => Fetched.runOrDoubleWrap(async () => {
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

        await SqrtPriceX96.queryOrThrow(context, pair, block, storage)?.mutateOrThrow(() => {
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