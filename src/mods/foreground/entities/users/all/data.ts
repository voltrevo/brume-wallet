import { RpcRequestPreinit } from "@/libs/rpc";
import { Background } from "@/mods/foreground/background/background";
import { FetchError, Fetched, FetcherMore, createQuerySchema, useOnce, useQuery } from "@hazae41/xswr";
import { User } from "../data";

export function getUsers(background: Background) {
  const fetcher = async <T>(init: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await background.router.tryRequest<T>(init).then(r => r.mapSync(x => Fetched.rewrap(x)).mapErrSync(FetchError.from))

  return createQuerySchema<RpcRequestPreinit<unknown>, User[], Error>({
    key: {
      method: "brume_getUsers"
    },
    fetcher
  })
}

export function useUsers(background: Background) {
  const query = useQuery(getUsers, [background])
  useOnce(query)
  return query
}