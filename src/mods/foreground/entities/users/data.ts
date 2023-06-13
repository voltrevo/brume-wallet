import { RpcRequestPreinit } from "@/libs/rpc"
import { Optional } from "@hazae41/option"
import { Fetched, FetcherMore, createQuerySchema, useOnce, useQuery } from "@hazae41/xswr"
import { Background } from "../../background/background"

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
  if (uuid === undefined)
    return undefined

  const fetcher = async <T>(init: RpcRequestPreinit, more: FetcherMore) =>
    Fetched.rewrap(await background.tryGet(0).then(async r => r.andThen(bg => bg.request<T>(init))))

  return createQuerySchema<RpcRequestPreinit, UserData, Error>({
    method: "brume_getUser",
    params: [uuid]
  }, fetcher)
}

export function useUser(uuid: Optional<string>, background: Background) {
  const query = useQuery(getUser, [uuid, background])
  useOnce(query)
  return query
}

export function getCurrentUser(background: Background) {
  const fetcher = async <T>(init: RpcRequestPreinit, more: FetcherMore) =>
    Fetched.rewrap(await background.tryGet(0).then(async r => r.andThen(bg => bg.request<T>(init))))

  return createQuerySchema<RpcRequestPreinit, User, Error>({
    method: "brume_getCurrentUser",
    params: undefined
  }, fetcher)
}

export function useCurrentUser(background: Background) {
  const query = useQuery(getCurrentUser, [background])
  useOnce(query)
  return query
}