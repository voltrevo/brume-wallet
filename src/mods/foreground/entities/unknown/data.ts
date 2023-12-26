import { BigIntToHex } from "@/libs/bigints/bigints";
import { Errors } from "@/libs/errors/errors";
import { ChainData } from "@/libs/ethereum/mods/chain";
import { BgEthereum } from "@/mods/background/service_worker/entities/unknown/data";
import { EthereumFetchParams, EthereumQueryKey } from "@/mods/background/service_worker/entities/wallets/data";
import { Fixed, ZeroHexString } from "@hazae41/cubane";
import { FetcherMore, createQuery, useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Nullable } from "@hazae41/option";
import { useSubscribe } from "../../storage/storage";
import { UserStorage, useUserStorageContext } from "../../storage/user";
import { FgEthereumContext, fetchOrFail } from "../wallets/data";

export namespace FgEthereum {

  export namespace Unknown {

    export type Key = BgEthereum.Unknown.Key
    export type Data = BgEthereum.Unknown.Data
    export type Fail = BgEthereum.Unknown.Fail

    export const key = BgEthereum.Unknown.key

    export function schema<T>(request: Nullable<RpcRequestPreinit<unknown> & EthereumFetchParams>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (request == null)
        return

      const fetcher = async (request: RpcRequestPreinit<unknown>) =>
        await fetchOrFail<T>(request, context)

      return createQuery<Key, T, Fail>({
        key: key(context.chain.chainId, request),
        fetcher,
        storage
      })
    }

  }

  export namespace EstimateGas {

    export type Key = EthereumQueryKey<unknown>
    export type Data = bigint
    export type Fail = Error

    export function key(request: RpcRequestPreinit<[unknown, unknown]>, context: FgEthereumContext) {
      return {
        chainId: context.chain.chainId,
        method: "eth_estimateGas",
        params: request.params
      }
    }

    export function schema(request: Nullable<RpcRequestPreinit<[unknown, unknown]>>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (request == null)
        return

      const fetcher = async (request: RpcRequestPreinit<unknown>) =>
        await fetchOrFail<ZeroHexString>(request, context).then(r => r.mapSync(BigInt))

      return createQuery<Key, Data, Fail>({
        key: key(request, context),
        fetcher,
        storage,
        dataSerializer: BigIntToHex
      })
    }

  }

  export namespace MaxPriorityFeePerGas {

    export type Key = EthereumQueryKey<unknown>
    export type Data = bigint
    export type Fail = Error

    export function key(chain: ChainData) {
      return {
        chainId: chain.chainId,
        method: "eth_maxPriorityFeePerGas",
        params: []
      }
    }

    export function schema(context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return

      const fetcher = async (request: RpcRequestPreinit<unknown>) =>
        await fetchOrFail<ZeroHexString>(request, context).then(r => r.mapSync(BigInt))

      return createQuery<Key, Data, Fail>({
        key: key(context.chain),
        fetcher,
        storage,
        dataSerializer: BigIntToHex
      })
    }

  }

  export namespace GasPrice {

    export type Key = EthereumQueryKey<unknown> & EthereumFetchParams
    export type Data = bigint
    export type Fail = Error

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

      const fetcher = async (request: RpcRequestPreinit<unknown>) =>
        await fetchOrFail<ZeroHexString>(request, context).then(r => r.mapSync(BigInt))

      return createQuery<Key, Data, Error>({
        key: key(context.chain),
        fetcher,
        storage,
        dataSerializer: BigIntToHex
      })
    }

  }

  export namespace Nonce {

    export type Key = EthereumQueryKey<unknown>
    export type Data = bigint
    export type Fail = Error

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

      const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
        await fetchOrFail<ZeroHexString>(request, context).then(r => r.mapSync(BigInt))

      return createQuery<EthereumQueryKey<unknown>, bigint, Error>({
        key: key(address, context.chain),
        fetcher,
        storage,
        dataSerializer: BigIntToHex,
      })
    }

  }

}

export function useUnknown(request: Nullable<RpcRequestPreinit<unknown> & EthereumFetchParams>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgEthereum.Unknown.schema, [request, context, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}

export function useEstimateGas(request: Nullable<RpcRequestPreinit<[unknown, unknown]>>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgEthereum.EstimateGas.schema, [request, context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}

export function useMaxPriorityFeePerGas(context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgEthereum.MaxPriorityFeePerGas.schema, [context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}

export function useGasPrice(context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgEthereum.GasPrice.schema, [context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}

export function useNonce(address: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgEthereum.Nonce.schema, [address, context, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}

export namespace FgTotal {

  export namespace Balance {

    export namespace Priced {

      export namespace ByAddress {

        export type Key = string
        export type Data = Fixed.From
        export type Fail = never

        export function key(address: ZeroHexString, coin: "usd") {
          return `totalWalletPricedBalance/${address}/${coin}`
        }

        export function schema(address: Nullable<ZeroHexString>, coin: "usd", storage: UserStorage) {
          if (address == null)
            return

          return createQuery<Key, Data, Fail>({ key: key(address, coin), storage })
        }

      }

      export type Key = string
      export type Data = Fixed.From
      export type Fail = never

      export function key(coin: "usd") {
        return `totalPricedBalance/${coin}`
      }

      export function schema(coin: "usd", storage: UserStorage) {
        return createQuery<Key, Data, Fail>({ key: key(coin), storage })
      }

    }

  }


}

export function useTotalPricedBalance(coin: "usd") {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgTotal.Balance.Priced.schema, [coin, storage])
  useSubscribe(query, storage)
  return query
}

export function useTotalWalletPricedBalance(address: Nullable<ZeroHexString>, coin: "usd") {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgTotal.Balance.Priced.ByAddress.schema, [address, coin, storage])
  useSubscribe(query, storage)
  return query
}