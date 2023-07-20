import { RpcRequestPreinit } from "@/libs/rpc"
import { Optional } from "@hazae41/option"
import { FetchError, Fetched, FetcherMore, createQuerySchema, useOnce, useQuery } from "@hazae41/xswr"
import { Background } from "../../background/background"
import { GlobalStorage, useGlobalStorage } from "../../storage/global"
import { useSubscribe } from "../../storage/storage"

export type User =
  | UserRef
  | UserData

export interface UserProps {
  user: User
}

export interface UserDataProps {
  user: UserData
}

export interface UserRef {
  ref: true
  uuid: string
}

export interface UserData {
  uuid: string,
  name: string,

  color: number
  emoji: string
}

export function getUser(uuid: Optional<string>, background: Background) {
  if (uuid == null)
    return undefined

  const fetcher = async <T>(init: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await background.tryRequest<T>(init).then(r => r.mapSync(x => Fetched.rewrap(x)).mapErrSync(FetchError.from))

  return createQuerySchema<RpcRequestPreinit<unknown>, UserData, Error>({
    key: {
      method: "brume_getUser",
      params: [uuid]
    },
    fetcher
  })
}

export function useUser(uuid: Optional<string>, background: Background) {
  const query = useQuery(getUser, [uuid, background])
  useOnce(query)
  return query
}

export function getCurrentUser(storage: GlobalStorage) {
  return createQuerySchema<string, User, Error>({ key: `user`, storage })
}

export function useCurrentUserQuery() {
  const storage = useGlobalStorage().unwrap()
  const query = useQuery(getCurrentUser, [storage])
  useSubscribe(query, storage)
  return query
}