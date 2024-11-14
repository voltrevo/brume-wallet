import { Errors } from "@/libs/errors/errors";
import { BgSimulation, SimulationData } from "@/mods/background/service_worker/entities/simulations/data";
import { createQuery, useError, useFetch, useQuery } from "@hazae41/glacier";
import { RpcRequestPreinit } from "@hazae41/jsonrpc";
import { Nullable } from "@hazae41/option";
import { UserStorage, useUserStorageContext } from "../../storage/user";
import { FgEthereumContext } from "../wallets/data";

export namespace FgSimulation {

  export type K = BgSimulation.K
  export type D = BgSimulation.D
  export type F = BgSimulation.F

  export const key = BgSimulation.key

  export function schema(tx: Nullable<unknown>, block: Nullable<string>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
    if (context == null)
      return
    if (tx == null)
      return
    if (block == null)
      return

    const fetcher = async (request: RpcRequestPreinit<unknown>) =>
      await context.customFetchOrFail<SimulationData>(request)

    return createQuery<K, D, F>({
      key: key(context.chain.chainId, tx, block),
      fetcher,
      storage
    })
  }

}

export function useSimulation(tx: Nullable<unknown>, block: Nullable<string>, context: Nullable<FgEthereumContext>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgSimulation.schema, [tx, block, context, storage])
  useFetch(query)
  useError(query, Errors.onQueryError)
  return query
}