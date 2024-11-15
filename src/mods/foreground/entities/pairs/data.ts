import { Errors } from "@/libs/errors/errors"
import { StoredPairData } from "@/libs/ethereum/mods/chain"
import { useUserStorageContext } from "@/mods/foreground/storage/user"
import { PairV2 } from "@/mods/universal/entities/pairs/v2"
import { PairV3 } from "@/mods/universal/entities/pairs/v3"
import { useError, useFetch, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { FgEthereumContext } from "../wallets/data"

export function usePairV2Price(context: Nullable<FgEthereumContext>, pair: Nullable<StoredPairData>, block: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(PairV2.Price.queryOrThrow, [context, pair, block, storage])
  useFetch(query)
  useVisible(query)
  useError(query, Errors.onQueryError)
  return query
}

export function usePairV3Price(context: Nullable<FgEthereumContext>, pair: Nullable<StoredPairData>, block: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(PairV3.Price.queryOrThrow, [context, pair, block, storage])
  useFetch(query)
  useVisible(query)
  useError(query, Errors.onQueryError)
  return query
}