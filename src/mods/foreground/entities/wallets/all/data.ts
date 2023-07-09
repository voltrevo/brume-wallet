import { RpcRequestPreinit } from "@/libs/rpc";
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { Background } from "@/mods/foreground/background/background";
import { FetchError, Fetched, FetcherMore, createQuerySchema, useOnce, useQuery } from "@hazae41/xswr";

export function getWallets(background: Background) {
  const fetcher = async <T>(init: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await background.tryRequest<T>(init).then(r => r.mapSync(x => Fetched.rewrap(x)).mapErrSync(FetchError.from))

  return createQuerySchema<RpcRequestPreinit<unknown>, Wallet[], Error>({
    key: {
      method: "brume_getWallets"
    },
    fetcher
  })
}

export function useWallets(background: Background) {
  const query = useQuery(getWallets, [background])
  useOnce(query)
  return query
}