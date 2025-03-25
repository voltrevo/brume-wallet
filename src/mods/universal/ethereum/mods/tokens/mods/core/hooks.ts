import { Errors } from "@/libs/errors"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { useUserStorageContext } from "@/mods/foreground/user/mods/storage"
import { Address } from "@hazae41/cubane"
import { useError, useFetch, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { Token, UserTokens, WalletTokens } from "."
import { BlockNumber } from "../../../blocks"
import { EthereumContext } from "../../../context"

export function useContractToken(context: Nullable<EthereumContext>, contract: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Token.queryOrThrow, [context, contract, block, storage])
  useFetch(query)
  useVisible(query)
  useError(query, Errors.onQueryError)

  return query
}

export function useOfflineContractToken(context: Nullable<EthereumContext>, contract: Nullable<Address>, block: Nullable<BlockNumber>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Token.queryOrThrow, [context, contract, block, storage])
  useError(query, Errors.onQueryError)

  return query
}

export function useUserTokens() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(UserTokens.queryOrThrow, [storage])
  return query
}

export function useWalletTokens(wallet: Nullable<Wallet>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(WalletTokens.queryOrThrow, [wallet, storage])
  return query
}