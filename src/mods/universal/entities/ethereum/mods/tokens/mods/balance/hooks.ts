import { useUserStorageContext } from "@/mods/foreground/storage/user"
import { EthereumContext } from "@/mods/universal/context/ethereum"
import { ZeroHexString } from "@hazae41/cubane"
import { useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { Balance } from "."

export function useNativeTokenPricedBalance(context: Nullable<EthereumContext>, account: Nullable<ZeroHexString>, currency: Nullable<"usd">, block: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Priced.Native.queryOrThrow, [context, account, currency, block, storage])

  return query
}

export function useContractTokenPricedBalance(context: Nullable<EthereumContext>, contract: Nullable<ZeroHexString>, account: Nullable<ZeroHexString>, currency: Nullable<"usd">, block: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Priced.Contract.queryOrThrow, [context, contract, account, currency, block, storage])

  return query
}
