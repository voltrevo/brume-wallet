import { RpcRequestPreinit } from "@/libs/rpc";
import { Backgrounds } from "@/mods/foreground/background/background";
import { Fetched, FetcherMore, createQuerySchema, useOnce, useQuery } from "@hazae41/xswr";
import { Wallet } from "../data";

export function getWalletsSchema(background: Backgrounds) {
  const fetcher = async <T>(init: RpcRequestPreinit<unknown>, more: FetcherMore) =>
    Fetched.rewrap(await background.tryGet(0).then(async r => r.andThen(bg => bg.request<T>(init))))

  return createQuerySchema<RpcRequestPreinit<unknown>, Wallet[], Error>({
    method: "brume_getWallets"
  }, fetcher)
}

export function useWallets(background: Backgrounds) {
  const query = useQuery(getWalletsSchema, [background])
  useOnce(query)
  return query
}