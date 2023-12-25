import { Errors } from "@/libs/errors/errors";
import { BgUnknown } from "@/mods/background/service_worker/entities/unknown/data";
import { EthereumFetchParams } from "@/mods/background/service_worker/entities/wallets/data";
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