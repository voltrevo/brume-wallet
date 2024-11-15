import { TokenAbi } from "@/libs/abi/erc20.abi"
import { ChainData, chainDataByChainId, pairByAddress } from "@/libs/ethereum/mods/chain"
import { Mutators } from "@/libs/glacier/mutators"
import { PairV2 } from "@/mods/universal/entities/pairs/v2"
import { PairV3 } from "@/mods/universal/entities/pairs/v3"
import { Cubane, Fixed, ZeroHexFixedInit, ZeroHexString } from "@hazae41/cubane"
import { createQuery, Data, Fail, FetcherMore, QueryStorage, States } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { None, Option, Some } from "@hazae41/option"
import { Catched, Result } from "@hazae41/result"
import { BgEthereumContext } from "../../context"
import { BgTotal } from "../unknown/data"
import { EthereumChainfulRpcRequestPreinit } from "../wallets/data"

export type Token =
  | TokenData
  | TokenRef

export type NativeToken =
  | NativeTokenData
  | NativeTokenRef

export type ContractToken =
  | ContractTokenData
  | ContractTokenRef

export type TokenRef =
  | NativeTokenRef
  | ContractTokenRef

export namespace TokenRef {
  export function from(token: TokenData) {
    if (token.type === "native")
      return NativeTokenRef.from(token)
    if (token.type === "contract")
      return ContractTokenRef.from(token)
    return token satisfies never
  }
}

export interface NativeTokenRef {
  readonly ref: true
  readonly uuid: string
  readonly type: "native"
  readonly chainId: number
}

export namespace NativeTokenRef {
  export function from(token: NativeTokenData): NativeTokenRef {
    const { uuid, type, chainId } = token
    return { ref: true, uuid, type, chainId }
  }
}

export interface ContractTokenRef {
  readonly ref: true
  readonly uuid: string
  readonly type: "contract"
  readonly chainId: number
  readonly address: ZeroHexString.Unsafe
}

export namespace ContractTokenRef {
  export function from(token: ContractTokenData): ContractTokenRef {
    const { uuid, type, chainId, address } = token
    return { ref: true, uuid, type, chainId, address }
  }
}

export type TokenData =
  | NativeTokenData
  | ContractTokenData

export interface NativeTokenData {
  readonly uuid: string
  readonly type: "native"
  readonly name: string
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
  readonly pairs?: readonly string[]
}

export interface ContractTokenData {
  readonly uuid: string
  readonly type: "contract",
  readonly name: string
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
  readonly address: ZeroHexString.Unsafe
  readonly pairs?: readonly ZeroHexString.Unsafe[]
}

export namespace BgToken {

  export namespace Balance {

    export type K = string
    export type D = Record<string, Fixed.From>
    export type F = never

    export function key(address: ZeroHexString, currency: "usd") {
      return `pricedBalanceByToken/${address}/${currency}`
    }

    export function schema(address: ZeroHexString, currency: "usd", storage: QueryStorage) {
      const indexer = async (states: States<D, F>) => {
        const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).getOr({})
        const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

        const totalBalance = BgTotal.Balance.Priced.ByAddress.schema(address, currency, storage)
        await totalBalance.mutate(Mutators.data<Fixed.From, never>(total))
      }

      return createQuery<K, D, F>({ key: key(address, currency), indexer, storage })
    }

  }

  export namespace Native {

    export namespace Balance {

      export namespace Priced {

        export type K = EthereumChainfulRpcRequestPreinit<unknown>
        export type D = Fixed.From
        export type F = never

        export function key(address: ZeroHexString, currency: "usd", chain: ChainData) {
          return {
            chainId: chain.chainId,
            method: "eth_getPricedBalance",
            params: [address, currency]
          }
        }

        export function schema(account: ZeroHexString, coin: "usd", context: BgEthereumContext, storage: QueryStorage) {
          const indexer = async (states: States<D, F>) => {
            const { current, previous } = states

            const previousData = previous?.real?.current.ok()?.getOrNull()
            const currentData = current.real?.current.ok()?.getOrNull()

            const key = `${context.chain.chainId}`
            const [value = new Fixed(0n, 0)] = [currentData]

            await BgToken.Balance.schema(account, coin, storage)?.mutate(s => {
              const { current } = s

              if (current == null)
                return new Some(new Data({ [key]: value }))
              if (current.isErr())
                return new None()

              return new Some(current.mapSync(c => ({ ...c, [key]: value })))
            })
          }

          return createQuery<K, D, F>({
            key: key(account, coin, context.chain),
            indexer,
            storage
          })
        }

      }

      export type K = EthereumChainfulRpcRequestPreinit<unknown>
      export type D = Fixed.From
      export type F = Error

      export function key(account: ZeroHexString, block: string, chain: ChainData) {
        return {
          version: 2,
          chainId: chain.chainId,
          method: "eth_getBalance",
          params: [account, block]
        }
      }

      export async function parseOrThrow(request: RpcRequestPreinit<unknown>, context: BgEthereumContext, storage: QueryStorage) {
        const [account, block] = (request as RpcRequestPreinit<[ZeroHexString, string]>).params

        return schema(account, block, context, storage)
      }

      export function schema(account: ZeroHexString, block: string, context: BgEthereumContext, storage: QueryStorage) {
        const fetcher = async (request: K, more: FetcherMore) => {
          try {
            const fetched = await context.fetchOrFail<ZeroHexString>(request, more)

            if (fetched.isErr())
              return fetched
            if (!ZeroHexString.Unknown.is(fetched.get()))
              throw new Error("Invalid response")

            const fixed = new ZeroHexFixedInit(fetched.get(), context.chain.token.decimals)

            return new Data(fixed)
          } catch (e: unknown) {
            return new Fail(Catched.wrap(e))
          }
        }

        const indexer = async (states: States<D, F>) => {
          if (block !== "pending")
            return

          const pricedBalance = await Option.wrap(states.current.real?.current.ok().getOrNull()).andThen(async balance => {
            if (context.chain.token.pairs == null)
              return new None()

            let pricedBalance: Fixed = Fixed.from(balance)

            for (const pairAddress of context.chain.token.pairs) {
              const pairData = pairByAddress[pairAddress]
              const chainData = chainDataByChainId[pairData.chainId]

              if (pairData.version === 2) {
                const priceQuery = PairV2.Price.queryOrThrow(context.switch(chainData), pairData, block, storage)
                const priceState = await priceQuery?.state

                if (priceState?.data == null)
                  return new None()

                pricedBalance = pricedBalance.mul(Fixed.from(priceState.data.get()))
                continue
              }

              if (pairData.version === 3) {
                const priceQuery = PairV3.Price.queryOrThrow(context.switch(chainData), pairData, block, storage)
                const priceState = await priceQuery?.state

                if (priceState?.data == null)
                  return new None()

                pricedBalance = pricedBalance.mul(Fixed.from(priceState.data.get()))
                continue
              }

              return new None()
            }

            return new Some(new Data(pricedBalance))
          }).then(o => o.getOrNull())

          const pricedBalanceQuery = Priced.schema(account, "usd", context, storage)
          await pricedBalanceQuery.mutate(() => new Some(pricedBalance))
        }

        return createQuery<K, D, F>({
          key: key(account, block, context.chain),
          fetcher,
          indexer,
          storage
        })
      }


    }

  }

  export namespace Contract {

    export namespace All {

      export type K = string
      export type D = ContractToken[]
      export type F = never

      export const key = `contractTokens`

      export function schema(storage: QueryStorage) {
        return createQuery<string, ContractTokenRef[], never>({ key, storage })
      }

    }

    export namespace Balance {

      export namespace Priced {

        export type K = EthereumChainfulRpcRequestPreinit<unknown>
        export type D = Fixed.From
        export type F = never

        export function key(address: ZeroHexString, token: ContractTokenData, currency: "usd", chain: ChainData) {
          return {
            chainId: chain.chainId,
            method: "eth_getTokenPricedBalance",
            params: [address, token.address, currency]
          }
        }

        export function schema(account: ZeroHexString, token: ContractTokenData, coin: "usd", context: BgEthereumContext, storage: QueryStorage) {
          const indexer = async (states: States<D, F>) => {
            const { current, previous } = states

            const previousData = previous?.real?.current.ok()?.getOrNull()
            const currentData = current.real?.current.ok()?.getOrNull()

            const key = `${context.chain.chainId}/${token.address}`
            const [value = new Fixed(0n, 0)] = [currentData]

            await BgToken.Balance.schema(account, coin, storage)?.mutate(s => {
              const { current } = s

              if (current == null)
                return new Some(new Data({ [key]: value }))
              if (current.isErr())
                return new None()

              return new Some(current.mapSync(c => ({ ...c, [key]: value })))
            })
          }

          return createQuery<K, D, F>({
            key: key(account, token, coin, context.chain),
            indexer,
            storage
          })
        }

      }

      export type K = EthereumChainfulRpcRequestPreinit<unknown>
      export type D = Fixed.From
      export type F = Error

      export function key(account: ZeroHexString, token: ContractTokenData, block: string, chain: ChainData) {
        return Result.runAndWrapSync(() => ({
          chainId: chain.chainId,
          method: "eth_call",
          params: [{
            to: token.address,
            data: Cubane.Abi.encodeOrThrow(TokenAbi.balanceOf.fromOrThrow(account))
          }, block]
        })).ok().inner
      }

      export function schema(account: ZeroHexString, token: ContractTokenData, block: string, context: BgEthereumContext, storage: QueryStorage) {
        const maybeKey = key(account, token, block, context.chain)

        if (maybeKey == null)
          return undefined

        const fetcher = async (request: K, more: FetcherMore) => {
          try {
            const fetched = await context.fetchOrFail<ZeroHexString>(request, more)

            if (fetched.isErr())
              return fetched

            const returns = Cubane.Abi.Tuple.create(Cubane.Abi.Uint256)
            const [balance] = Cubane.Abi.decodeOrThrow(returns, fetched.inner).inner
            const fixed = new Fixed(balance.intoOrThrow(), token.decimals)

            return new Data(fixed)
          } catch (e: unknown) {
            return new Fail(Catched.wrap(e))
          }
        }

        const indexer = async (states: States<D, F>) => {
          if (block !== "pending")
            return

          const pricedBalance = await Option.wrap(states.current.real?.current.ok().getOrNull()).andThen(async balance => {
            if (token.pairs == null)
              return new None()

            let pricedBalance: Fixed = Fixed.from(balance)

            for (const pairAddress of token.pairs) {
              const pairData = pairByAddress[pairAddress]
              const chainData = chainDataByChainId[pairData.chainId]

              if (pairData.version === 2) {
                const priceQuery = PairV2.Price.queryOrThrow(context.switch(chainData), pairData, block, storage)
                const priceState = await priceQuery?.state

                if (priceState?.data == null)
                  return new None()

                pricedBalance = pricedBalance.mul(Fixed.from(priceState.data.get()))
                continue
              }

              if (pairData.version === 3) {
                const priceQuery = PairV3.Price.queryOrThrow(context.switch(chainData), pairData, block, storage)
                const priceState = await priceQuery?.state

                if (priceState?.data == null)
                  return new None()

                pricedBalance = pricedBalance.mul(Fixed.from(priceState.data.get()))
                continue
              }

              return new None()
            }

            return new Some(new Data(pricedBalance))
          }).then(o => o.getOrNull())

          const pricedBalanceQuery = Priced.schema(account, token, "usd", context, storage)
          await pricedBalanceQuery.mutate(() => new Some(pricedBalance))
        }

        return createQuery<K, D, F>({
          key: maybeKey,
          fetcher,
          indexer,
          storage
        })
      }

    }

    export type K = string
    export type D = ContractTokenData
    export type F = never

    export function key(chainId: number, address: string) {
      return `contractToken/${chainId}/${address}`
    }

    export function schema(chainId: number, address: string, storage: QueryStorage) {
      const indexer = async (states: States<D, F>) => {
        const { current, previous } = states

        const previousData = previous?.real?.current.ok()?.getOrNull()
        const currentData = current.real?.current.ok()?.getOrNull()

        if (previousData?.uuid === currentData?.uuid)
          return

        if (previousData != null) {
          await All.schema(storage)?.mutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
          }))
        }

        if (currentData != null) {
          await All.schema(storage)?.mutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => [...p, ContractTokenRef.from(currentData)])
          }))
        }
      }

      return createQuery<K, D, F>({
        key: key(chainId, address),
        indexer,
        storage
      })
    }

  }

}