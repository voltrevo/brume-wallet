import { Errors } from "@/libs/errors"
import { BgEns } from "@/mods/background/service_worker/entities/names/data"
import { Address, ZeroHexString } from "@hazae41/cubane"
import { createQuery, useError, useFetch, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { UserStorage, useUserStorageContext } from "../../user/mods/storage"
import { FgEthereumContext } from "../wallets/data"

export namespace FgEns {

  export namespace Lookup {

    export type K = BgEns.Lookup.K
    export type D = BgEns.Lookup.D
    export type F = BgEns.Lookup.F

    export const key = BgEns.Lookup.key

    export function schema(name: Nullable<string>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (name == null)
        return

      const fetcher = async (request: K) =>
        await context.customFetchOrThrow<Address>(request)

      return createQuery<K, D, F>({
        key: key(name),
        fetcher,
        storage
      })
    }

  }

  export namespace Reverse {

    export type K = BgEns.Reverse.K
    export type D = BgEns.Reverse.D
    export type F = BgEns.Reverse.F

    export const key = BgEns.Reverse.key

    export function schema(address: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (address == null)
        return

      const fetcher = async (request: K) =>
        await context.customFetchOrThrow<ZeroHexString>(request)

      return createQuery<K, D, F>({
        key: key(address),
        fetcher,
        storage
      })
    }

  }

}

export function useEnsLookup(name: Nullable<string>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgEns.Lookup.schema, [name, context, storage])
  useFetch(query)
  useVisible(query)

  useError(query, Errors.onQueryError)
  return query
}

export function useEnsReverse(address: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgEns.Reverse.schema, [address, context, storage])
  useFetch(query)
  useVisible(query)

  useError(query, Errors.onQueryError)
  return query
}

/**
 * Used in the wallet list to display the ens name
 * @param address 
 * @param context 
 * @returns 
 */
export function useEnsReverseNoFetch(address: Nullable<ZeroHexString>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgEns.Reverse.schema, [address, context, storage])

  return query
}