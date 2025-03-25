import { Errors } from "@/libs/errors"
import { useUserStorageContext } from "@/mods/foreground/user/mods/storage"
import { useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { BlockNumber, GetBlock } from "."
import { EthereumContext } from "../context"

export function useBlockByNumber(context: Nullable<EthereumContext>, number: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(GetBlock.ByNumber.queryOrThrow, [context, number, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 1000)
  useError(query, Errors.onQueryError)

  return query
}