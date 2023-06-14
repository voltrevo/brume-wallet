import { RpcRequestPreinit } from "@/libs/rpc";
import { Backgrounds } from "@/mods/foreground/background/background";
import { Fetched, FetcherMore, createQuerySchema, useOnce, useQuery } from "@hazae41/xswr";
import { User } from "../data";

export function getUsers(background: Backgrounds) {
  const fetcher = async <T>(init: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    Fetched.rewrap(await background.tryGet(0).then(async r => r.andThen(bg => bg.request<T>(init))))

  return createQuerySchema<RpcRequestPreinit<unknown>, User[], Error>({
    method: "brume_getUsers"
  }, fetcher)
}

export function useUsers(background: Backgrounds) {
  const query = useQuery(getUsers, [background])
  useOnce(query)
  return query
}