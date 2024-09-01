import { Errors } from "@/libs/errors/errors"
import { BgEns } from "@/mods/background/service_worker/entities/names/data"
import { Address, ZeroHexString } from "@hazae41/cubane"
import { createQuery, useError, useFetch, useQuery, useVisible } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { Nullable } from "@hazae41/option"
import { UserStorage, useUserStorageContext } from "../../storage/user"
import { FgEthereumContext, customFetchOrFail } from "../wallets/data"

export namespace FgEns {

  export namespace Lookup {

    export type Key = BgEns.Lookup.Key
    export type Data = BgEns.Lookup.Data
    export type Fail = BgEns.Lookup.Fail

    export const key = BgEns.Lookup.key

    export function schema(name: Nullable<string>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (name == null)
        return

      const fetcher = async (request: RpcRequestPreinit<unknown>) =>
        await customFetchOrFail<Address>(request, context)

      return createQuery<Key, Data, Fail>({
        key: key(name),
        fetcher,
        storage
      })
    }

  }

  export namespace Reverse {

    export type Key = BgEns.Reverse.Key
    export type Data = BgEns.Reverse.Data
    export type Fail = BgEns.Reverse.Fail

    export const key = BgEns.Reverse.key

    export function schema(address: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (address == null)
        return

      const fetcher = async (request: RpcRequestPreinit<unknown>) =>
        await customFetchOrFail<ZeroHexString>(request, context)

      return createQuery<Key, Data, Fail>({
        key: key(address),
        fetcher,
        storage
      })
    }

  }

}

export function useEnsLookup(name: Nullable<string>, ethereum: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgEns.Lookup.schema, [name, ethereum, storage])
  useFetch(query)
  useVisible(query)

  useError(query, Errors.onQueryError)
  return query
}

export function useEnsReverse(address: Nullable<ZeroHexString>, ethereum: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgEns.Reverse.schema, [address, ethereum, storage])
  useFetch(query)
  useVisible(query)

  useError(query, Errors.onQueryError)
  return query
}

/**
 * Used in the wallet list to display the ens name
 * @param address 
 * @param ethereum 
 * @returns 
 */
export function useEnsReverseNoFetch(address: Nullable<ZeroHexString>, ethereum: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgEns.Reverse.schema, [address, ethereum, storage])

  return query
}