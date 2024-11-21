import { UniswapV3FactoryAbi, UniswapV3PoolAbi } from "@/libs/abi/uniswap.abi"
import { ZeroHexBigInt } from "@/libs/bigints/bigints"
import { Records } from "@/libs/records"
import { UniswapV3 } from "@/libs/uniswap"
import { EthereumChainfulRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { EthereumContext } from "@/mods/universal/context/ethereum"
import { Abi, Address, Fixed, ZeroHexString } from "@hazae41/cubane"
import { createQuery, Data, Fail, QueryStorage, States } from "@hazae41/glacier"
import { Nullable, Option, Some } from "@hazae41/option"
import { Catched } from "@hazae41/result"
import { ERC20Metadata } from "../../tokens/mods"

export namespace FactoryV3 {

  export const factoryByChainId = {
    1: "0x1F98431c8aD98523631AE4a59f267346ea31F984" as ZeroHexString
  }

  export const wethByChainId = {
    1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as ZeroHexString
  }

  export const usdcByChainId = {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as ZeroHexString
  }

  export const usdcWethPoolByChainId = {
    1: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640" as ZeroHexString
  }

  export namespace GetPool {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = Address
    export type F = Error

    export function keyOrThrow(chainId: number, token0: ZeroHexString, token1: ZeroHexString, fee: number, block: string) {
      return {
        chainId: chainId,
        method: "eth_call",
        params: [{
          to: Records.getOrThrow(factoryByChainId, chainId),
          data: Abi.encodeOrThrow(UniswapV3FactoryAbi.getPool.fromOrThrow(token0, token1, fee))
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, token0: Nullable<ZeroHexString>, token1: Nullable<ZeroHexString>, fee: Nullable<number>, block: Nullable<string>, storage: QueryStorage) {
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

      const fetcher = async (request: K, init: RequestInit) => {
        const fetched = await context.fetchOrThrow<ZeroHexString>(request, init)

        if (fetched.isErr())
          return fetched

        try {
          const returns = Abi.Address
          const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

          const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 365)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(decoded, { cooldown, expiration })
        } catch (e: unknown) {
          return new Fail(Catched.wrap(e))
        }
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, token0, token1, fee, block),
        fetcher,
        storage
      })
    }

  }

}

export namespace UniswapV3Pool {

  export namespace Token0 {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = Address
    export type F = Error

    export function keyOrThrow(chainId: number, pool: ZeroHexString, block: string) {
      return {
        chainId: chainId,
        method: "eth_call",
        params: [{
          to: pool,
          data: Abi.encodeOrThrow(UniswapV3PoolAbi.token0.fromOrThrow())
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pool: Nullable<ZeroHexString>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (pool == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const fetched = await context.fetchOrThrow<ZeroHexString>(request, init)

        if (fetched.isErr())
          return fetched

        try {
          const returns = Abi.Address
          const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

          const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 365)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(decoded, { cooldown, expiration })
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

  export namespace Token1 {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = Address
    export type F = Error

    export function keyOrThrow(chainId: number, pool: ZeroHexString, block: string) {
      return {
        chainId: chainId,
        method: "eth_call",
        params: [{
          to: pool,
          data: Abi.encodeOrThrow(UniswapV3PoolAbi.token1.fromOrThrow())
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pool: Nullable<ZeroHexString>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (pool == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const fetched = await context.fetchOrThrow<ZeroHexString>(request, init)

        if (fetched.isErr())
          return fetched

        try {
          const returns = Abi.Address
          const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

          const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 365)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(decoded, { cooldown, expiration })
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

  export namespace Price {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = readonly [Fixed.From, Fixed.From]
    export type F = Error

    export function keyOrThrow(chainId: number, pool: ZeroHexString, block: string) {
      return {
        chainId: chainId,
        method: "eth_getUniswapV3PoolPrice",
        params: [pool, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pool: Nullable<ZeroHexString>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (pool == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const token0AddressFetched = await Token0.queryOrThrow(context, pool, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (token0AddressFetched.isErr())
          return token0AddressFetched

        const token1AddressFetched = await Token1.queryOrThrow(context, pool, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (token1AddressFetched.isErr())
          return token1AddressFetched

        const token0DecimalsFetched = await ERC20Metadata.Decimals.queryOrThrow(context, token0AddressFetched.get(), block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (token0DecimalsFetched.isErr())
          return token0DecimalsFetched

        const token1DecimalsFetched = await ERC20Metadata.Decimals.queryOrThrow(context, token1AddressFetched.get(), block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (token1DecimalsFetched.isErr())
          return token1DecimalsFetched

        const sqrtPriceX96Fetched = await SqrtPriceX96.queryOrThrow(context, pool, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (sqrtPriceX96Fetched.isErr())
          return sqrtPriceX96Fetched

        const sqrtPriceX96BigInt = ZeroHexBigInt.from(sqrtPriceX96Fetched.get()).value

        const token0Data = { address: token0AddressFetched.get(), decimals: token0DecimalsFetched.get() } as const
        const token1Data = { address: token1AddressFetched.get(), decimals: token1DecimalsFetched.get() } as const

        const poolData = { address: pool, token0: token0Data, token1: token1Data } as const

        return new Data(UniswapV3.computeOrThrow(poolData, sqrtPriceX96BigInt), sqrtPriceX96Fetched)
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, pool, block),
        fetcher,
        storage
      })
    }
  }

  export namespace SqrtPriceX96 {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = ZeroHexBigInt.From
    export type F = Error

    export function keyOrThrow(chainId: number, pool: ZeroHexString, block: string) {
      return {
        chainId: chainId,
        method: "eth_getUniswapV3PoolSqrtPriceX96",
        params: [pool, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pool: Nullable<ZeroHexString>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (pool == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const slot0 = await Slot0.queryOrThrow(context, pool, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (slot0.isErr())
          return slot0

        const [sqrtPriceX96] = slot0.get()

        return new Data(sqrtPriceX96, slot0)
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, pool, block),
        fetcher,
        storage
      })
    }

  }

  export namespace Slot0 {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = readonly [ZeroHexBigInt.From, ZeroHexBigInt.From, ZeroHexBigInt.From, ZeroHexBigInt.From, ZeroHexBigInt.From, ZeroHexBigInt.From]
    export type F = Error

    export function keyOrThrow(chainId: number, pool: ZeroHexString, block: string) {
      return {
        chainId: chainId,
        method: "eth_call",
        params: [{
          to: pool,
          data: Abi.encodeOrThrow(UniswapV3PoolAbi.slot0.fromOrThrow())
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pool: Nullable<ZeroHexString>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (pool == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const fetched = await context.fetchOrThrow<ZeroHexString>(request, init)

        if (fetched.isErr())
          return fetched

        try {
          const returns = Abi.Tuple.create(Abi.Uint160, Abi.Uint160, Abi.Uint32, Abi.Uint32, Abi.Uint32, Abi.Uint32)
          const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow().map(x => new ZeroHexBigInt(x))

          const cooldown = Date.now() + (1000 * 60)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(decoded as unknown as D, { cooldown, expiration })
        } catch (e: unknown) {
          return new Fail(Catched.wrap(e))
        }
      }

      const indexer = async (states: States<D, F>) => {
        const { current } = states

        const maybeCurrentData = current.real?.current.checkOrNull()

        await SqrtPriceX96.queryOrThrow(context, pool, block, storage)?.mutateOrThrow(() => {
          if (maybeCurrentData == null)
            return new Some(undefined)

          const [sqrtPriceX96] = maybeCurrentData.get()

          return new Some(new Data(sqrtPriceX96, maybeCurrentData))
        })
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, pool, block),
        fetcher,
        indexer,
        storage
      })

    }

  }

}