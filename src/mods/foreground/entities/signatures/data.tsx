import { Errors } from "@/libs/errors/errors";
import { BgSignature, SignatureData } from "@/mods/background/service_worker/entities/signatures/data";
import { ZeroHexString } from "@hazae41/cubane";
import { createQuery, useError, useFetch, useQuery, useVisible } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Nullable } from "@hazae41/option";
import { useSubscribe } from "../../storage/storage";
import { UserStorage, useUserStorageContext } from "../../storage/user";
import { FgEthereumContext, fetchOrFail } from "../wallets/data";

export namespace FgSignature {

  export type Key = BgSignature.Key
  export type Data = BgSignature.Data
  export type Fail = BgSignature.Fail

  export const key = BgSignature.key

  export function schema(ethereum: Nullable<FgEthereumContext>, hash: Nullable<ZeroHexString>, storage: UserStorage) {
    if (ethereum == null)
      return
    if (hash == null)
      return

    const fetcher = async (request: RpcRequestPreinit<unknown>) =>
      await fetchOrFail<SignatureData[]>(request, ethereum)

    return createQuery<Key, Data, Fail>({
      key: key(hash),
      fetcher,
      storage
    })
  }

}

export function useSignature(ethereum: Nullable<FgEthereumContext>, hash: Nullable<ZeroHexString>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgSignature.schema, [ethereum, hash, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}