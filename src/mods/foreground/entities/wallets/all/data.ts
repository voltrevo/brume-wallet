import { RpcRequestPreinit } from "@/libs/rpc";
import { Background } from "@/mods/foreground/background/background";
import { FetchError, Fetched, FetcherMore, createQuerySchema, useOnce, useQuery } from "@hazae41/xswr";
import { Wallet } from "../data";

export function getWalletsSchema(background: Background) {
  const fetcher = async <T>(init: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await background.tryRequest<T>(init).then(r => r.mapSync(x => Fetched.rewrap(x)).mapErrSync(FetchError.from))

  return createQuerySchema<RpcRequestPreinit<unknown>, Wallet[], Error>({
    method: "brume_getWallets"
  }, fetcher)
}

export function useWallets(background: Background) {
  const query = useQuery(getWalletsSchema, [background])
  useOnce(query)
  return query
}