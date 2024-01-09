import { Errors } from "@/libs/errors/errors"
import { useWait } from "@/libs/glacier/hooks"
import { BgTransactionReceipt } from "@/mods/background/service_worker/entities/transactions/data"
import { ZeroHexString } from "@hazae41/cubane"
import { createQuery, useError, useQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { Nullable } from "@hazae41/option"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorageContext } from "../../storage/user"
import { FgEthereumContext, fetchOrFail2 } from "../wallets/data"

export namespace FgTransactionReceipt {

  export type Key = BgTransactionReceipt.Key
  export type Data = BgTransactionReceipt.Data
  export type Fail = BgTransactionReceipt.Fail

  export const key = BgTransactionReceipt.key

  export function schema(hash: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
    if (context == null)
      return
    if (hash == null)
      return

    const fetcher = async (request: RpcRequestPreinit<unknown>) =>
      await fetchOrFail2<Data>(request, context)

    return createQuery<Key, Data, Fail>({
      key: key(hash, context.chain),
      fetcher,
      storage
    })
  }

}

export function useTransactionReceipt(hash: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgTransactionReceipt.schema, [hash, context, storage])
  useWait(query, 1000)
  useSubscribe(query, storage)
  useError(query, Errors.onQueryError)
  return query
}