import { Errors } from "@/libs/errors/errors"
import { useUserStorageContext } from "@/mods/foreground/storage/user"
import { Address } from "@hazae41/cubane"
import { useError, useFetch, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { ERC20Metadata } from "."
import { BlockNumber } from "../../../blocks"
import { EthereumContext } from "../../../context"

export function useERC20MetadataName(context: Nullable<EthereumContext>, contract: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(ERC20Metadata.Name.queryOrThrow, [context, contract, block, storage])
  useFetch(query)
  useVisible(query)
  useError(query, Errors.onQueryError)

  return query
}

export function useERC20MetadataSymbol(context: Nullable<EthereumContext>, contract: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(ERC20Metadata.Symbol.queryOrThrow, [context, contract, block, storage])
  useFetch(query)
  useVisible(query)
  useError(query, Errors.onQueryError)

  return query
}

export function useERC20MetadataDecimals(context: Nullable<EthereumContext>, contract: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(ERC20Metadata.Decimals.queryOrThrow, [context, contract, block, storage])
  useFetch(query)
  useVisible(query)
  useError(query, Errors.onQueryError)

  return query
}