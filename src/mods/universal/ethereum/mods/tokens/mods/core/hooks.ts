import { Errors } from "@/libs/errors/errors"
import { useUserStorageContext } from "@/mods/foreground/storage/user"
import { Address } from "@hazae41/cubane"
import { useError, useFetch, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { Token, UserTokens } from "."
import { BlockNumber } from "../../../blocks"
import { EthereumContext } from "../../../context"

export function useUserTokens() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(UserTokens.queryOrThrow, [storage])
  return query
}

export function useToken(context: Nullable<EthereumContext>, contract: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Token.queryOrThrow, [context, contract, block, storage])
  useFetch(query)
  useVisible(query)
  useError(query, Errors.onQueryError)

  return query
}