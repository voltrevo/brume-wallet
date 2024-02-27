import { Errors } from "@/libs/errors/errors"
import { chainByChainId, pairByAddress } from "@/libs/ethereum/mods/chain"
import { Mutators } from "@/libs/glacier/mutators"
import { useEffectButNotFirstTime } from "@/libs/react/effect"
import { BgToken, ContractTokenData, ContractTokenRef } from "@/mods/background/service_worker/entities/tokens/data"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { Cubane, Fixed, ZeroHexFixed, ZeroHexString } from "@hazae41/cubane"
import { Data, Fail, FetcherMore, States, core, createQuery, useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { None, Nullable, Option, Some } from "@hazae41/option"
import { Catched } from "@hazae41/result"
import { FgTotal } from "../unknown/data"
import { FgEthereumContext, fetchOrFail } from "../wallets/data"
import { FgPair } from "./pairs/data"

export namespace FgToken {

  export namespace Balance {

    export type Key = BgToken.Balance.Key
    export type Data = BgToken.Balance.Data
    export type Fail = BgToken.Balance.Fail

    export const key = BgToken.Balance.key

    export function schema(address: Nullable<ZeroHexString>, currency: "usd", storage: UserStorage) {
      if (address == null)
        return

      const indexer = async (states: States<Data, Fail>) => {
        const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr({})
        const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

        const totalBalance = FgTotal.Balance.Priced.ByAddress.schema(address, currency, storage)
        await totalBalance?.mutate(Mutators.data<Fixed.From, never>(total))
      }

      return createQuery<Key, Data, Fail>({ key: key(address, currency), indexer, storage })
    }

  }

  export namespace Native {

    export namespace Balance {

      export namespace Priced {

        export type Key = BgToken.Native.Balance.Priced.Key
        export type Data = BgToken.Native.Balance.Priced.Data
        export type Fail = BgToken.Native.Balance.Priced.Fail

        export const key = BgToken.Native.Balance.Priced.key

        export function schema(account: Nullable<ZeroHexString>, coin: "usd", context: Nullable<FgEthereumContext>, storage: UserStorage) {
          if (context == null)
            return
          if (account == null)
            return

          const indexer = async (states: States<Data, Fail>) => {
            const { current, previous } = states

            const previousData = previous?.real?.current.ok()?.get()
            const currentData = current.real?.current.ok()?.get()

            const key = `${context.chain.chainId}`
            const [value = new Fixed(0n, 0)] = [currentData]

            await FgToken.Balance.schema(account, coin, storage)?.mutate(s => {
              const { current } = s

              if (current == null)
                return new Some(new Data({ [key]: value }))
              if (current.isErr())
                return new None()

              return new Some(current.mapSync(c => ({ ...c, [key]: value })))
            })
          }

          return createQuery<Key, Data, Fail>({
            key: key(account, coin, context.chain),
            indexer,
            storage
          })
        }

      }

      export type Key = BgToken.Native.Balance.Key
      export type Data = BgToken.Native.Balance.Data
      export type Fail = BgToken.Native.Balance.Fail

      export const key = BgToken.Native.Balance.key

      export function schema(address: Nullable<ZeroHexString>, block: Nullable<string>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
        if (address == null)
          return
        if (context == null)
          return
        if (block == null)
          return

        const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
          await fetchOrFail<ZeroHexString>(request, context).then(f => f.mapSync(x => new ZeroHexFixed(x, context.chain.token.decimals)))

        const indexer = async (states: States<Data, Fail>) => {
          if (block !== "pending")
            return

          const pricedBalance = await Option.wrap(states.current.real?.current.ok().get()).andThen(async balance => {
            if (context.chain.token.pairs == null)
              return new None()

            let pricedBalance: Fixed = Fixed.from(balance)

            for (const pairAddress of context.chain.token.pairs) {
              const pair = pairByAddress[pairAddress]
              const chain = chainByChainId[pair.chainId]

              const price = FgPair.Price.schema(pair, block, { ...context, chain }, storage)
              const priceState = await price?.state

              if (priceState?.data == null)
                return new None()

              pricedBalance = pricedBalance.mul(Fixed.from(priceState.data.get()))
            }

            return new Some(new Data(pricedBalance))
          }).then(o => o.get())

          const pricedBalanceQuery = Priced.schema(address, "usd", context, storage)
          await pricedBalanceQuery?.mutate(() => new Some(pricedBalance))
        }

        return createQuery<Key, Data, Fail>({
          key: key(address, block, context.chain),
          fetcher,
          indexer,
          storage
        })

      }
    }
  }

  export namespace Contract {

    export namespace Balance {

      export namespace Priced {

        export type Key = BgToken.Contract.Balance.Priced.Key
        export type Data = BgToken.Contract.Balance.Priced.Data
        export type Fail = BgToken.Contract.Balance.Priced.Fail

        export const key = BgToken.Contract.Balance.Priced.key

        export function schema(account: Nullable<ZeroHexString>, token: Nullable<ContractTokenData>, coin: "usd", context: Nullable<FgEthereumContext>, storage: UserStorage) {
          if (context == null)
            return
          if (account == null)
            return
          if (token == null)
            return

          const indexer = async (states: States<Data, Fail>) => {
            const { current, previous } = states

            const previousData = previous?.real?.current.ok()?.get()
            const currentData = current.real?.current.ok()?.get()

            const key = `${context.chain.chainId}/${token.address}`
            const [value = new Fixed(0n, 0)] = [currentData]

            await FgToken.Balance.schema(account, coin, storage)?.mutate(s => {
              const { current } = s

              if (current == null)
                return new Some(new Data({ [key]: value }))
              if (current.isErr())
                return new None()

              return new Some(current.mapSync(c => ({ ...c, [key]: value })))
            })
          }

          return createQuery<Key, Data, Fail>({
            key: key(account, token, coin, context.chain),
            indexer,
            storage
          })
        }

      }

      export type K = BgToken.Contract.Balance.K
      export type D = BgToken.Contract.Balance.D
      export type F = BgToken.Contract.Balance.F

      export const key = BgToken.Contract.Balance.key

      export function schema(address: Nullable<ZeroHexString>, token: Nullable<ContractTokenData>, block: Nullable<string>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
        if (address == null)
          return
        if (token == null)
          return
        if (context == null)
          return
        if (block == null)
          return

        const maybeKey = key(address, token, block, context.chain)

        if (maybeKey == null)
          return

        const fetcher = async (request: K, more: FetcherMore = {}) => {
          try {
            const fetched = await fetchOrFail<ZeroHexString>(request, context)

            if (fetched.isErr())
              return fetched

            const returns = Cubane.Abi.Tuple.create(Cubane.Abi.Uint256)
            const [balance] = Cubane.Abi.decodeOrThrow(returns, fetched.inner).inner
            const fixed = new Fixed(balance.intoOrThrow(), token.decimals)

            return new Data(fixed)
          } catch (e: unknown) {
            return new Fail(Catched.from(e))
          }
        }

        const indexer = async (states: States<D, F>) => {
          if (block !== "pending")
            return

          const pricedBalanceData = await Option.wrap(states.current.real?.current.ok()?.get()).andThen(async balance => {
            if (token.pairs == null)
              return new None()

            let pricedBalance: Fixed = Fixed.from(balance)

            for (const pairAddress of token.pairs) {
              const pair = pairByAddress[pairAddress]
              const chain = chainByChainId[pair.chainId]

              const price = FgPair.Price.schema(pair, block, { ...context, chain }, storage)
              const priceState = await price?.state

              if (priceState?.data == null)
                return new None()

              pricedBalance = pricedBalance.mul(Fixed.from(priceState.data.get()))
            }

            return new Some(new Data(pricedBalance))
          }).then(o => o.get())

          const pricedBalanceQuery = Priced.schema(address, token, "usd", context, storage)
          await pricedBalanceQuery?.mutate(() => new Some(pricedBalanceData))
        }

        return createQuery<K, D, F>({
          key: maybeKey,
          fetcher,
          indexer,
          storage
        })
      }

    }

    export namespace All {

      export type Key = BgToken.Contract.All.Key
      export type Data = BgToken.Contract.All.Data
      export type Fail = BgToken.Contract.All.Fail

      export const key = BgToken.Contract.All.key

      export function schema(storage: UserStorage) {
        return createQuery<Key, Data, Fail>({ key, storage })
      }

    }

    export type K = BgToken.Contract.K
    export type D = BgToken.Contract.D
    export type F = BgToken.Contract.F

    export const key = BgToken.Contract.key

    export function schema(chainId: Nullable<number>, address: Nullable<string>, storage: UserStorage) {
      if (chainId == null)
        return
      if (address == null)
        return

      const indexer = async (states: States<D, F>) => {
        const { current, previous } = states

        const previousData = previous?.real?.current.ok()?.get()
        const currentData = current.real?.current.ok()?.get()

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

export function useToken(chainId: Nullable<number>, address: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Contract.schema, [chainId, address, storage])

  return query
}

export function useTokens() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Contract.All.schema, [storage])

  return query
}

export function useNativeBalance(address: Nullable<ZeroHexString>, block: Nullable<string>, context: Nullable<FgEthereumContext>, prices: Nullable<Nullable<Fixed.From>[]>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Native.Balance.schema, [address, block, context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)

  useError(query, Errors.onQueryError)

  useEffectButNotFirstTime(() => {
    if (context == null)
      return
    if (query.cacheKey == null)
      return
    core.reindexOrThrow(query.cacheKey, query).catch(console.warn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, prices])

  return query
}

export function useContractBalance(address: Nullable<ZeroHexString>, token: Nullable<ContractTokenData>, block: Nullable<string>, context: Nullable<FgEthereumContext>, prices: Nullable<Nullable<Fixed.From>[]>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Contract.Balance.schema, [address, token, block, context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)

  useError(query, Errors.onQueryError)

  useEffectButNotFirstTime(() => {
    if (context == null)
      return
    if (query.cacheKey == null)
      return
    core.reindexOrThrow(query.cacheKey, query).catch(console.warn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, prices])

  return query
}

export function useNativePricedBalance(address: Nullable<ZeroHexString>, coin: "usd", context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Native.Balance.Priced.schema, [address, coin, context, storage])

  return query
}

export function useContractPricedBalance(address: Nullable<ZeroHexString>, token: Nullable<ContractTokenData>, coin: "usd", context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Contract.Balance.Priced.schema, [address, token, coin, context, storage])

  return query
}
