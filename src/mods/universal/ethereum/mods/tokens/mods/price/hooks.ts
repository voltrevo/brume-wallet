import { Errors } from "@/libs/errors/errors"
import { useUserStorageContext } from "@/mods/foreground/storage/user"
import { EthereumContext } from "@/mods/universal/ethereum/mods/context"
import { Price } from "@/mods/universal/ethereum/mods/tokens/mods"
import { Address } from "@hazae41/cubane"
import { useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { BlockNumber } from "../../../blocks"

export function useNativeTokenPriceV3(context: Nullable<EthereumContext>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Price.Native.queryOrThrow, [context, block, storage])
  useFetch(query, { cache: "reload" })
  useVisible(query, { cache: "reload" })
  useInterval(query, 10 * 1000)
  useError(query, Errors.onQueryError)

  return query
}

export function useContractTokenPriceV3(context: Nullable<EthereumContext>, token: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Price.Contract.queryOrThrow, [context, token, block, storage])
  useFetch(query, { cache: "reload" })
  useVisible(query, { cache: "reload" })
  useInterval(query, 10 * 1000)
  useError(query, Errors.onQueryError)

  return query
}