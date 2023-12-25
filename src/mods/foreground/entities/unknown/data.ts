import { BigIntToHex } from "@/libs/bigints/bigints";
import { Errors } from "@/libs/errors/errors";
import { BgUnknown } from "@/mods/background/service_worker/entities/unknown/data";
import { EthereumFetchParams, EthereumQueryKey } from "@/mods/background/service_worker/entities/wallets/data";
import { ZeroHexString } from "@hazae41/cubane";
import { createQuery, useError, useFetch, useQuery, useVisible } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Nullable } from "@hazae41/option";
import { useSubscribe } from "../../storage/storage";
import { UserStorage, useUserStorageContext } from "../../storage/user";
import { FgEthereumContext, fetchOrFail } from "../wallets/data";

export namespace FgUnknown {

  export type Key = BgUnknown.Key
  export type Data = BgUnknown.Data
  export type Fail = BgUnknown.Fail

  export const key = BgUnknown.key

  export function schema<T>(request: RpcRequestPreinit<unknown> & EthereumFetchParams, context: Nullable<FgEthereumContext>, storage: UserStorage) {
    if (context == null)
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

export function useUnknown(request: RpcRequestPreinit<unknown> & EthereumFetchParams, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgUnknown.schema, [request, context, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}

export namespace FgEthereum {

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

}

export function useEstimateGas(request: Nullable<RpcRequestPreinit<[unknown, unknown]>>, ethereum: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgEthereum.EstimateGas.schema, [request, ethereum, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}