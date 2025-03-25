import { Errors } from "@/libs/errors"
import { useUserStorageContext } from "@/mods/foreground/user/mods/storage"
import { EthereumContext } from "@/mods/universal/ethereum/mods/context"
import { Address } from "@hazae41/cubane"
import { useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { Balance } from "."
import { BlockNumber } from "../../../blocks"

export function useWalletTotalPricedBalance(account: Nullable<Address>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Priced.Total.ByWallet.queryOrThrow, [account, storage])

  return query
}

export function useNativeTokenBalance(context: Nullable<EthereumContext>, account: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Native.queryOrThrow, [context, account, block, storage])
  useFetch(query, { cache: "reload" })
  useVisible(query, { cache: "reload" })
  useInterval(query, 1000)
  useError(query, Errors.onQueryError)

  return query
}

export function useOfflineNativeTokenBalance(context: Nullable<EthereumContext>, account: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Native.queryOrThrow, [context, account, block, storage])
  useError(query, Errors.onQueryError)

  return query
}

export function useContractTokenBalance(context: Nullable<EthereumContext>, contract: Nullable<Address>, account: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Contract.queryOrThrow, [context, contract, account, block, storage])
  useFetch(query, { cache: "reload" })
  useVisible(query, { cache: "reload" })
  useInterval(query, 1000)
  useError(query, Errors.onQueryError)

  return query
}

export function useOfflineContractTokenBalance(context: Nullable<EthereumContext>, contract: Nullable<Address>, account: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Contract.queryOrThrow, [context, contract, account, block, storage])
  useError(query, Errors.onQueryError)

  return query
}

export function useNativeTokenPricedBalance(context: Nullable<EthereumContext>, account: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Priced.Native.queryOrThrow, [context, account, block, storage])
  useFetch(query, { cache: "reload" })
  useVisible(query, { cache: "reload" })
  useInterval(query, 1000)
  useError(query, Errors.onQueryError)

  return query
}

export function useOfflineNativeTokenPricedBalance(context: Nullable<EthereumContext>, account: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Priced.Native.queryOrThrow, [context, account, block, storage])
  useError(query, Errors.onQueryError)

  return query
}

export function useContractTokenPricedBalance(context: Nullable<EthereumContext>, contract: Nullable<Address>, account: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Priced.Contract.queryOrThrow, [context, contract, account, block, storage])
  useFetch(query, { cache: "reload" })
  useVisible(query, { cache: "reload" })
  useInterval(query, 1000)
  useError(query, Errors.onQueryError)

  return query
}

export function useOfflineContractTokenPricedBalance(context: Nullable<EthereumContext>, contract: Nullable<Address>, account: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Priced.Contract.queryOrThrow, [context, contract, account, block, storage])
  useError(query, Errors.onQueryError)

  return query
}
