import { BigIntToHex } from "@/libs/bigints/bigints";
import { Errors } from "@/libs/errors/errors";
import { ChainData } from "@/libs/ethereum/mods/chain";
import { BgEthereum, BgTotal } from "@/mods/background/service_worker/entities/unknown/data";
import { EthereumChainlessQueryKey, EthereumQueryKey } from "@/mods/background/service_worker/entities/wallets/data";
import { Fixed, ZeroHexString } from "@hazae41/cubane";
import { Data, FetcherMore, States, createQuery, useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { None, Nullable, Some } from "@hazae41/option";
import { UserStorage, useUserStorageContext } from "../../storage/user";
import { FgEthereumContext } from "../wallets/data";

export namespace FgEthereum {

  export namespace Unknown {

    export type K = BgEthereum.Unknown.K
    export type D = BgEthereum.Unknown.D
    export type F = BgEthereum.Unknown.F

    export const key = BgEthereum.Unknown.key

    export function schema<T>(request: Nullable<EthereumChainlessQueryKey<unknown>>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (request == null)
        return

      const fetcher = async (request: K) =>
        await context.fetchOrFail<T>(request)

      return createQuery<K, T, F>({
        key: key(context.chain.chainId, request),
        fetcher,
        storage
      })
    }

  }

  export namespace EstimateGas {

    export type K = EthereumQueryKey<unknown>
    export type D = bigint
    export type F = Error

    export function key(request: RpcRequestPreinit<[unknown, unknown]>, context: FgEthereumContext) {
      return {
        chainId: context.chain.chainId,
        method: "eth_estimateGas",
        params: request.params,
        noCheck: true
      }
    }

    export function schema(request: Nullable<RpcRequestPreinit<[unknown, unknown]>>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (request == null)
        return

      const fetcher = async (request: K) =>
        await context.fetchOrFail<ZeroHexString>(request).then(r => r.mapSync(BigInt))

      return createQuery<K, D, F>({
        key: key(request, context),
        fetcher,
        storage,
        dataSerializer: BigIntToHex
      })
    }

  }

  export namespace MaxPriorityFeePerGas {

    export type K = EthereumQueryKey<unknown>
    export type D = bigint
    export type F = Error

    export function key(chain: ChainData) {
      return {
        chainId: chain.chainId,
        method: "eth_maxPriorityFeePerGas",
        params: [],
        noCheck: true
      }
    }

    export function schema(context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return

      const fetcher = async (request: K) =>
        await context.fetchOrFail<ZeroHexString>(request).then(r => r.mapSync(BigInt))

      return createQuery<K, D, F>({
        key: key(context.chain),
        fetcher,
        storage,
        dataSerializer: BigIntToHex
      })
    }

  }

  export namespace GasPrice {

    export type K = EthereumQueryKey<unknown>
    export type D = bigint
    export type F = Error

    export function key(chain: ChainData) {
      return {
        chainId: chain.chainId,
        method: "eth_gasPrice",
        params: [],
        noCheck: true
      }
    }

    export function schema(context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return

      const fetcher = async (request: K) =>
        await context.fetchOrFail<ZeroHexString>(request).then(r => r.mapSync(BigInt))

      return createQuery<K, D, Error>({
        key: key(context.chain),
        fetcher,
        storage,
        dataSerializer: BigIntToHex
      })
    }

  }

  export namespace Nonce {

    export type K = EthereumQueryKey<unknown>
    export type D = bigint
    export type F = Error

    export function key(address: ZeroHexString, chain: ChainData) {
      return {
        chainId: chain.chainId,
        method: "eth_getTransactionCount",
        params: [address, "pending"]
      }
    }

    export function schema(address: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (address == null)
        return
      if (context == null)
        return

      const fetcher = async (request: K, more: FetcherMore = {}) =>
        await context.fetchOrFail<ZeroHexString>(request).then(r => r.mapSync(BigInt))

      return createQuery<K, D, F>({
        key: key(address, context.chain),
        fetcher,
        storage,
        dataSerializer: BigIntToHex,
      })
    }

  }

}

export function useUnknown(request: Nullable<EthereumChainlessQueryKey<unknown>>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgEthereum.Unknown.schema, [request, context, storage])
  useFetch(query)
  useVisible(query)

  useError(query, Errors.onQueryError)
  return query
}

export function useEstimateGas(request: Nullable<RpcRequestPreinit<[unknown, unknown]>>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgEthereum.EstimateGas.schema, [request, context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)

  useError(query, Errors.onQueryError)
  return query
}

export function useMaxPriorityFeePerGas(context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgEthereum.MaxPriorityFeePerGas.schema, [context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)

  useError(query, Errors.onQueryError)
  return query
}

export function useGasPrice(context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgEthereum.GasPrice.schema, [context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)

  useError(query, Errors.onQueryError)
  return query
}

export function useNonce(address: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgEthereum.Nonce.schema, [address, context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)

  useError(query, Errors.onQueryError)
  return query
}

export namespace FgTotal {

  export namespace Balance {

    export namespace Priced {

      export namespace ByAddress {

        export namespace Record {

          export type K = BgTotal.Balance.Priced.ByAddress.Record.K
          export type D = BgTotal.Balance.Priced.ByAddress.Record.D
          export type F = BgTotal.Balance.Priced.ByAddress.Record.F

          export const key = BgTotal.Balance.Priced.ByAddress.Record.key

          export function schema(coin: "usd", storage: UserStorage) {
            const indexer = async (states: States<D, F>) => {
              const { current, previous } = states

              const previousData = previous?.real?.current.ok()?.getOrNull()
              const currentData = current.real?.current.ok()?.getOrNull()

              const [record = {}] = [currentData]

              const total = Object.values(record).reduce<Fixed>((x, y) => {
                if (y.count === 0)
                  return x

                return Fixed.from(y.value).add(x)
              }, new Fixed(0n, 0))

              await Priced.schema(coin, storage).mutate(() => new Some(new Data(total)))
            }

            return createQuery<K, D, F>({ key: key(coin), indexer, storage })
          }

        }

        export type K = string
        export type D = Fixed.From
        export type F = never

        export const key = BgTotal.Balance.Priced.ByAddress.key

        export function schema(account: Nullable<ZeroHexString>, coin: "usd", storage: UserStorage) {
          if (account == null)
            return

          const indexer = async (states: States<D, F>) => {
            const { current, previous } = states

            const previousData = previous?.real?.current.ok()?.getOrNull()
            const currentData = current.real?.current.ok()?.getOrNull()

            const [value = new Fixed(0n, 0)] = [currentData]

            await Record.schema(coin, storage)?.mutate(s => {
              const { current } = s

              const [{ count = 0 } = {}] = [current?.ok().getOrNull()?.[account]]

              const inner = { count, value }

              if (current == null)
                return new Some(new Data({ [account]: inner }))
              if (current.isErr())
                return new None()

              return new Some(current.mapSync(c => ({ ...c, [account]: inner })))
            })
          }

          return createQuery<K, D, F>({ key: key(account, coin), indexer, storage })
        }

      }

      export type K = string
      export type D = Fixed.From
      export type F = never

      export function key(coin: "usd") {
        return `totalPricedBalance/${coin}`
      }

      export function schema(coin: "usd", storage: UserStorage) {
        return createQuery<K, D, F>({ key: key(coin), storage })
      }

    }

  }


}

export function useTotalPricedBalance(coin: "usd") {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgTotal.Balance.Priced.schema, [coin, storage])

  return query
}

export function useTotalWalletPricedBalance(address: Nullable<ZeroHexString>, coin: "usd") {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgTotal.Balance.Priced.ByAddress.schema, [address, coin, storage])

  return query
}