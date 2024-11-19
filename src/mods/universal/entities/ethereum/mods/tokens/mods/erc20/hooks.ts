import { Errors } from "@/libs/errors/errors"
import { SimpleContractTokenData } from "@/libs/ethereum/mods/chain"
import { useUserStorageContext } from "@/mods/foreground/storage/user"
import { EthereumContext } from "@/mods/universal/context/ethereum"
import { ZeroHexString } from "@hazae41/cubane"
import { useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { ERC20 } from "."

export function useEthereumERC20Balance(context: Nullable<EthereumContext>, contract: Nullable<SimpleContractTokenData>, address: Nullable<ZeroHexString>, block: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(ERC20.BalanceOf.queryOrThrow, [context, contract?.address, address, block, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 10 * 1000)
  useError(query, Errors.onQueryError)

  return query
}