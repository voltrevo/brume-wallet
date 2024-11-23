import { Errors } from "@/libs/errors/errors"
import { useUserStorageContext } from "@/mods/foreground/storage/user"
import { ZeroHexString } from "@hazae41/cubane"
import { useError, useFetch, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { Sighash } from "."
import { EthereumContext } from "../context"

export function useSighash(context: Nullable<EthereumContext<100>>, hash: Nullable<ZeroHexString>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Sighash.queryOrThrow, [context, hash, storage])
  useFetch(query)
  useVisible(query)
  useError(query, Errors.onQueryError)

  return query
}