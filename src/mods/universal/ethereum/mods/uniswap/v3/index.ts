import { UniswapV3FactoryAbi, UniswapV3PoolAbi } from "@/libs/abi/uniswap.abi"
import { ZeroHexBigInt } from "@/libs/bigints/bigints"
import { Records } from "@/libs/records"
import { UniswapV3 } from "@/libs/uniswap"
import { EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { EthereumContext } from "@/mods/universal/ethereum/mods/context"
import { Abi, Address, Fixed, ZeroHexString } from "@hazae41/cubane"
import { createQuery, Data, Fail, JsonRequest, QueryStorage, States } from "@hazae41/glacier"
import { Nullable, Option, Some } from "@hazae41/option"
import { Catched } from "@hazae41/result"
import { BlockNumber } from "../../blocks"
import { ERC20Metadata } from "../../tokens/mods"

export namespace FactoryV3 {

  export const factoryByChainId = {
    1: "0x1F98431c8aD98523631AE4a59f267346ea31F984" as Address,
    10: "0x1F98431c8aD98523631AE4a59f267346ea31F984" as Address,
    56: "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7" as Address,
    137: "0x1F98431c8aD98523631AE4a59f267346ea31F984" as Address,
    324: "0x8FdA5a7a8dCA67BBcDd10F02Fa0649A937215422" as Address,
    8453: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD" as Address,
    42161: "0x1F98431c8aD98523631AE4a59f267346ea31F984" as Address,
    42220: "0xAfE208a311B21f13EF87E33A90049fC17A7acDEc" as Address,
    43114: "0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD" as Address
  }

  export const wethByChainId = {
    1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as Address,
    10: "0x4200000000000000000000000000000000000006" as Address,
    56: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" as Address,
    137: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270" as Address,
    324: "0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E" as Address,
    8453: "0x4200000000000000000000000000000000000006" as Address,
    42161: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" as Address,
    42220: "0x471EcE3750Da237f93B8E339c536989b8978a438" as Address,
    43114: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7" as Address
  }

  export const usdcByChainId = {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
    10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" as Address,
    56: "0x55d398326f99059fF775485246999027B3197955" as Address,
    137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as Address,
    324: "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4" as Address,
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address,
    42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as Address,
    42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as Address,
    43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" as Address
  }

  export const usdcWethPoolByChainId = {
    1: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640" as Address,
    10: "0x1fb3cf6e48F1E7B10213E7b6d87D4c073C7Fdb7b" as Address,
    56: "0x6fe9E9de56356F7eDBfcBB29FAB7cd69471a4869" as Address,
    137: "0xA374094527e1673A86dE625aa59517c5dE346d32" as Address,
    324: "0xa0769A3c6AF68812Bb3A5cBd511f7879033440Eb" as Address,
    8453: "0xd0b53D9277642d899DF5C87A3966A349A798F224" as Address,
    42161: "0xC6962004f452bE9203591991D15f6b388e09E8D0" as Address,
    42220: "0x2d70cBAbf4d8e61d5317b62cBe912935FD94e0FE" as Address,
    43114: "0xfAe3f424a0a47706811521E3ee268f00cFb5c45E" as Address
  }

  export namespace GetPool {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = Address
    export type F = Error

    export function keyOrThrow(chainId: number, token0: Address, token1: Address, fee: number, block: BlockNumber) {
      const body = {
        method: "eth_call",
        params: [{
          to: Records.getOrThrow(factoryByChainId, chainId),
          data: Abi.encodeOrThrow(UniswapV3FactoryAbi.getPool.fromOrThrow(token0, token1, fee))
        }, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, token0: Nullable<Address>, token1: Nullable<Address>, fee: Nullable<number>, block: Nullable<BlockNumber>, storage: QueryStorage) {
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
        const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
        const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

        if (fetched.isErr())
          return fetched

        try {
          const returns = Abi.Tuple.create(Abi.Address)
          const [decoded] = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

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

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = Address
    export type F = Error

    export function keyOrThrow(chainId: number, pool: Address, block: BlockNumber) {
      const body = {
        method: "eth_call",
        params: [{
          to: pool,
          data: Abi.encodeOrThrow(UniswapV3PoolAbi.token0.fromOrThrow())
        }, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pool: Nullable<Address>, block: Nullable<BlockNumber>, storage: QueryStorage) {
      if (context == null)
        return
      if (pool == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
        const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

        if (fetched.isErr())
          return fetched

        try {
          const returns = Abi.Tuple.create(Abi.Address)
          const [decoded] = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

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

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = Address
    export type F = Error

    export function keyOrThrow(chainId: number, pool: Address, block: BlockNumber) {
      const body = {
        method: "eth_call",
        params: [{
          to: pool,
          data: Abi.encodeOrThrow(UniswapV3PoolAbi.token1.fromOrThrow())
        }, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pool: Nullable<Address>, block: Nullable<BlockNumber>, storage: QueryStorage) {
      if (context == null)
        return
      if (pool == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
        const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

        if (fetched.isErr())
          return fetched

        try {
          const returns = Abi.Tuple.create(Abi.Address)
          const [decoded] = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

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

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = readonly [Fixed.From, Fixed.From]
    export type F = Error

    export function keyOrThrow(chainId: number, pool: Address, block: BlockNumber) {
      const body = {
        method: "eth_getUniswapV3PoolPrice",
        params: [pool, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pool: Nullable<Address>, block: Nullable<BlockNumber>, storage: QueryStorage) {
      if (context == null)
        return
      if (pool == null)
        return
      if (block == null)
        return

      const fetcher = async (_: K, init: RequestInit) => {
        const { signal, cache } = init

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

        const sqrtPriceX96Fetched = await SqrtPriceX96.queryOrThrow(context, pool, block, storage)!.fetchOrThrow({ signal, cache }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

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

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = ZeroHexBigInt.From
    export type F = Error

    export function keyOrThrow(chainId: number, pool: Address, block: BlockNumber) {
      const body = {
        method: "eth_getUniswapV3PoolSqrtPriceX96",
        params: [pool, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pool: Nullable<Address>, block: Nullable<BlockNumber>, storage: QueryStorage) {
      if (context == null)
        return
      if (pool == null)
        return
      if (block == null)
        return

      const fetcher = async (_: K, init: RequestInit) => {
        const { signal, cache } = init

        const slot0 = await Slot0.queryOrThrow(context, pool, block, storage)!.fetchOrThrow({ signal, cache }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

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

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = readonly [ZeroHexBigInt.From, ZeroHexBigInt.From, ZeroHexBigInt.From, ZeroHexBigInt.From, ZeroHexBigInt.From, ZeroHexBigInt.From]
    export type F = Error

    export function keyOrThrow(chainId: number, pool: Address, block: BlockNumber) {
      const body = {
        method: "eth_call",
        params: [{
          to: pool,
          data: Abi.encodeOrThrow(UniswapV3PoolAbi.slot0.fromOrThrow())
        }, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pool: Nullable<Address>, block: Nullable<BlockNumber>, storage: QueryStorage) {
      if (context == null)
        return
      if (pool == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
        const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

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

  export namespace Liquidity {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = ZeroHexBigInt.From
    export type F = Error

    export function keyOrThrow(chainId: number, pool: Address, block: BlockNumber) {
      const body = {
        method: "eth_call",
        params: [{
          to: pool,
          data: Abi.encodeOrThrow(UniswapV3PoolAbi.liquidity.fromOrThrow())
        }, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, pool: Nullable<Address>, block: Nullable<BlockNumber>, storage: QueryStorage) {
      if (context == null)
        return
      if (pool == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
        const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

        if (fetched.isErr())
          return fetched

        try {
          const returns = Abi.Tuple.create(Abi.Uint128)
          const [decoded] = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

          const cooldown = Date.now() + (1000 * 60)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(new ZeroHexBigInt(decoded), { cooldown, expiration })
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