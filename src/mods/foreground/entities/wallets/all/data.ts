import { RpcRequestPreinit } from "@/libs/rpc";
import { Background } from "@/mods/foreground/background/background";
import { Fetched, FetcherMore, createQuerySchema, useQuery } from "@hazae41/xswr";
import { Wallet } from "../data";

export function getWalletsSchema(background: Background) {
  const fetcher = async <T>(init: RpcRequestPreinit, more: FetcherMore) =>
    Fetched.rewrap(await background.request<T>(init))

  return createQuerySchema<Wallet[], RpcRequestPreinit>({
    method: "brume_getWallets",
    params: undefined
  }, fetcher)
}

export function useWallets(background: Background) {
  return useQuery(getWalletsSchema, [background])
}