import { Errors } from "@/libs/errors/errors"
import { useUserStorageContext } from "@/mods/foreground/storage/user"
import { EthereumContext } from "@/mods/universal/context/ethereum"
import { ZeroHexString } from "@hazae41/cubane"
import { useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { Balance } from "."

export function useNativeTokenBalance(context: Nullable<EthereumContext>, account: Nullable<ZeroHexString>, block: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Native.queryOrThrow, [context, account, block, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)
  useError(query, Errors.onQueryError)

  return query
}

export function useContractTokenBalance(context: Nullable<EthereumContext>, contract: Nullable<ZeroHexString>, account: Nullable<ZeroHexString>, block: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Contract.queryOrThrow, [context, contract, account, block, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)
  useError(query, Errors.onQueryError)

  return query
}

export function useNativeTokenPricedBalance(context: Nullable<EthereumContext>, account: Nullable<ZeroHexString>, currency: Nullable<"usd">, block: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Priced.Native.queryOrThrow, [context, account, currency, block, storage])
  useError(query, Errors.onQueryError)

  return query
}

export function useContractTokenPricedBalance(context: Nullable<EthereumContext>, contract: Nullable<ZeroHexString>, account: Nullable<ZeroHexString>, currency: Nullable<"usd">, block: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Priced.Contract.queryOrThrow, [context, contract, account, currency, block, storage])
  useError(query, Errors.onQueryError)

  return query
}
