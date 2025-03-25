import { ZeroHexBigInt } from "@/libs/bigints/bigints";
import { Errors } from "@/libs/errors";
import { ChainData } from "@/libs/ethereum/mods/chain";
import { BgEthereum } from "@/mods/background/service_worker/entities/unknown/data";
import { EthereumChainfulRpcRequestPreinit, EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data";
import { ZeroHexString } from "@hazae41/cubane";
import { createQuery, useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Nullable } from "@hazae41/option";
import { UserStorage, useUserStorageContext } from "../../user/mods/storage";
import { FgEthereumContext } from "../wallets/data";

export namespace FgEthereum {

  export namespace Unknown {

    export type K = BgEthereum.Unknown.K
    export type D = BgEthereum.Unknown.D
    export type F = BgEthereum.Unknown.F

    export const key = BgEthereum.Unknown.key

    export function schema<T>(request: Nullable<EthereumChainlessRpcRequestPreinit<unknown>>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (request == null)
        return

      const fetcher = async (request: K) =>
        await context.fetchOrThrow<T>(request)

      return createQuery<K, T, F>({
        key: key(context.chain.chainId, request),
        fetcher,
        storage
      })
    }

  }

  export namespace EstimateGas {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = ZeroHexBigInt.From
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
        await context.fetchOrThrow<ZeroHexString>(request)

      return createQuery<K, D, F>({
        key: key(request, context),
        fetcher,
        storage
      })
    }

  }

  export namespace MaxPriorityFeePerGas {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = ZeroHexBigInt.From
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
        await context.fetchOrThrow<ZeroHexString>(request)

      return createQuery<K, D, F>({
        key: key(context.chain),
        fetcher,
        storage
      })
    }

  }

  export namespace GasPrice {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = ZeroHexBigInt.From
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
        await context.fetchOrThrow<ZeroHexString>(request)

      return createQuery<K, D, Error>({
        key: key(context.chain),
        fetcher,
        storage
      })
    }

  }

  export namespace Nonce {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = ZeroHexBigInt.From
    export type F = Error

    export function key(address: ZeroHexString, chain: ChainData) {
      return {
        chainId: chain.chainId,
        method: "eth_getTransactionCount",
        params: [address, "latest"]
      }
    }

    export function schema(address: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (address == null)
        return
      if (context == null)
        return

      const fetcher = async (request: K, init: RequestInit = {}) =>
        await context.fetchOrThrow<ZeroHexString>(request)

      return createQuery<K, D, F>({
        key: key(address, context.chain),
        fetcher,
        storage
      })
    }

  }

}

export function useUnknown(request: Nullable<EthereumChainlessRpcRequestPreinit<unknown>>, context: Nullable<FgEthereumContext>) {
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
