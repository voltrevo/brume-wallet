import { Errors } from "@/libs/errors/errors"
import { Mutators } from "@/libs/glacier/mutators"
import { useEffectButNotFirstTime } from "@/libs/react/effect"
import { BgToken, ContractTokenData, ContractTokenRef } from "@/mods/background/service_worker/entities/tokens/data"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { Fixed, ZeroHexString } from "@hazae41/cubane"
import { Data, FetcherMore, States, createQuery, useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { Nullable } from "@hazae41/option"
import { FgEthereumContext, fetchOrFail, indexOrThrow } from "../wallets/data"

export namespace FgToken {

  export namespace Native {

    export namespace Balance {

      export namespace Priced {

        export type Key = BgToken.Native.Balance.Priced.Key
        export type Data = BgToken.Native.Balance.Priced.Data
        export type Fail = BgToken.Native.Balance.Priced.Fail

        export const key = BgToken.Native.Balance.Priced.key

        export function schema(address: Nullable<ZeroHexString>, coin: "usd", context: Nullable<FgEthereumContext>, storage: UserStorage) {
          if (context == null)
            return
          if (address == null)
            return

          return createQuery<Key, Data, Fail>({
            key: key(address, coin, context.chain),
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
          await fetchOrFail<Fixed.From>(request, context)

        return createQuery<Key, Data, Fail>({
          key: key(address, block, context.chain),
          fetcher,
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

          return createQuery<Key, Data, Fail>({
            key: key(account, token, coin, context.chain),
            storage
          })
        }

      }

      export type Key = BgToken.Contract.Balance.Key
      export type Data = BgToken.Contract.Balance.Data
      export type Fail = BgToken.Contract.Balance.Fail

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

        const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
          await fetchOrFail<Fixed.From>(request, context)

        return createQuery<Key, Data, Fail>({
          key: key(address, token, block, context.chain),
          fetcher,
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

    export type Key = BgToken.Contract.Key
    export type Data = BgToken.Contract.Data
    export type Fail = BgToken.Contract.Fail

    export const key = BgToken.Contract.key

    export function schema(chainId: number, address: string, storage: UserStorage) {
      const indexer = async (states: States<Data, Fail>) => {
        const { current, previous } = states

        const previousData = previous?.real?.data?.inner
        const currentData = current.real?.data?.inner

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

      return createQuery<Key, Data, Fail>({
        key: key(chainId, address),
        indexer,
        storage
      })
    }

  }

}

export function useToken(chainId: number, address: string) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Contract.schema, [chainId, address, storage])
  useSubscribe(query, storage)
  return query
}

export function useTokens() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Contract.All.schema, [storage])
  useSubscribe(query, storage)
  return query
}

export function useNativeBalance(address: Nullable<ZeroHexString>, block: Nullable<string>, context: Nullable<FgEthereumContext>, prices: Nullable<Fixed.From>[]) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Native.Balance.schema, [address, block, context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)

  useEffectButNotFirstTime(() => {
    if (context == null)
      return
    indexOrThrow(query.key, context).catch(() => { })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, ...prices])

  return query
}

export function useContractBalance(address: Nullable<ZeroHexString>, token: Nullable<ContractTokenData>, block: Nullable<string>, context: Nullable<FgEthereumContext>, prices: Nullable<Fixed.From>[]) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Contract.Balance.schema, [address, token, block, context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)

  useEffectButNotFirstTime(() => {
    if (context == null)
      return
    indexOrThrow(query.key, context).catch(() => { })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, ...prices])

  return query
}

export function useNativePricedBalance(address: Nullable<ZeroHexString>, coin: "usd", context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Native.Balance.Priced.schema, [address, coin, context, storage])
  useSubscribe(query, storage)
  return query
}

export function useContractPricedBalance(address: Nullable<ZeroHexString>, token: Nullable<ContractTokenData>, coin: "usd", context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Contract.Balance.Priced.schema, [address, token, coin, context, storage])
  useSubscribe(query, storage)
  return query
}
