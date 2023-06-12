import { RpcRequestPreinit } from "@/libs/rpc";
import { Background } from "@/mods/foreground/background/background";
import { Fetched, FetcherMore, createQuerySchema, useOnce, useQuery } from "@hazae41/xswr";
import { User } from "../data";

export function getUsers(background: Background) {
  const fetcher = async <T>(init: RpcRequestPreinit, more: FetcherMore) =>
    Fetched.rewrap(await background.request<T>(init))

  return createQuerySchema<User[], RpcRequestPreinit>({
    method: "brume_getUsers",
    params: undefined
  }, fetcher)
}

export function useUsers(background: Background) {
  const query = useQuery(getUsers, [background])
  useOnce(query)
  return query
}