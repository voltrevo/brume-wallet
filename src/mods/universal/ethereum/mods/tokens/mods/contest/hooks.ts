import { Errors } from "@/libs/errors/errors";
import { useUserStorageContext } from "@/mods/foreground/user/mods/storage";
import { useError, useFetch, useInterval, useQuery, useVisible } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { Contest } from ".";
import { BlockNumber } from "../../../blocks";
import { EthereumContext } from "../../../context";

export function useRankedToken(context: Nullable<EthereumContext<1>>, block: Nullable<BlockNumber>, rank: Nullable<number>) {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Contest.Ranking.TokenOf.queryOrThrow, [context, rank, block, storage])
  useFetch(query)
  useVisible(query)
  useInterval(query, 1000)
  useError(query, Errors.onQueryError)

  return query
}