import { createQuerySchema, useQuery } from "@hazae41/glacier"
import { Optional } from "@hazae41/option"
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

export function getUser(uuid: Optional<string>, storage: GlobalStorage) {
  if (uuid == null)
    return undefined

  return createQuerySchema<string, UserData, never>({ key: `user/${uuid}`, storage })
}

export function useUser(uuid: Optional<string>) {
  const storage = useGlobalStorage().unwrap()
  const query = useQuery(getUser, [uuid, storage])
  useSubscribe(query as any, storage)
  return query
}

export function getCurrentUser(storage: GlobalStorage) {
  return createQuerySchema<string, User, never>({ key: `user`, storage })
}

export function useCurrentUserQuery() {
  const storage = useGlobalStorage().unwrap()
  const query = useQuery(getCurrentUser, [storage])
  useSubscribe(query, storage)
  return query
}