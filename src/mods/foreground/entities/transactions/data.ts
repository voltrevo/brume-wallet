import { Errors } from "@/libs/errors/errors"
import { useWait } from "@/libs/glacier/hooks"
import { BgTransaction, BgTransactionReceipt, BgTransactionTrial } from "@/mods/background/service_worker/entities/transactions/data"
import { ZeroHexString } from "@hazae41/cubane"
import { createQuery, useError, useQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { Nullable } from "@hazae41/option"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorageContext } from "../../storage/user"
import { FgEthereumContext, fetchOrFail2 } from "../wallets/data"

export namespace FgTransaction {

  export type Key = BgTransaction.Key
  export type Data = BgTransaction.Data
  export type Fail = BgTransaction.Fail

  export const key = BgTransaction.key

  export function schema(uuid: Nullable<string>, storage: UserStorage) {
    if (uuid == null)
      return

    return createQuery<Key, Data, Fail>({
      key: key(uuid),
      storage
    })
  }

}

export function useTransaction(uuid: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgTransaction.schema, [uuid, storage])
  useSubscribe(query, storage)
  return query
}

export namespace FgTransactionTrial {

  export type Key = BgTransactionTrial.Key
  export type Data = BgTransactionTrial.Data
  export type Fail = BgTransactionTrial.Fail

  export const key = BgTransactionTrial.key

  export function schema(uuid: Nullable<string>, storage: UserStorage) {
    if (uuid == null)
      return

    return createQuery<Key, Data, Fail>({
      key: key(uuid),
      storage
    })
  }

}

export function useTransactionTrial(uuid: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgTransactionTrial.schema, [uuid, storage])
  useSubscribe(query, storage)
  return query
}

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