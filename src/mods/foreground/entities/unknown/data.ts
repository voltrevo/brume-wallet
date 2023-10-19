import { BgUnknown } from "@/mods/background/service_worker/entities/unknown/data";
import { EthereumFetchParams } from "@/mods/background/service_worker/entities/wallets/data";
import { createQuery, useError, useFetch, useQuery, useVisible } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Nullable } from "@hazae41/option";
import { useSubscribe } from "../../storage/storage";
import { UserStorage, useUserStorage } from "../../storage/user";
import { EthereumContext, tryFetch } from "../wallets/data";

export namespace FgUnknown {

  export function schema<T>(request: RpcRequestPreinit<unknown> & EthereumFetchParams, context: Nullable<EthereumContext>, storage: UserStorage) {
    if (context == null)
      return

    const fetcher = async (request: RpcRequestPreinit<unknown>) =>
      await tryFetch<T>(request, context)

    return createQuery<RpcRequestPreinit<unknown>, T, Error>({
      key: BgUnknown.key(context.chain.chainId, request),
      fetcher,
      storage
    })
  }

}

export function useUnknown(request: RpcRequestPreinit<unknown> & EthereumFetchParams, context: Nullable<EthereumContext>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(FgUnknown.schema, [request, context, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}