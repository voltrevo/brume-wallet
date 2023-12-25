import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { GlobalStorage, useGlobalStorageContext } from "../../storage/global"
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

export function getUser(uuid: Nullable<string>, storage: GlobalStorage) {
  if (uuid == null)
    return undefined

  return createQuery<string, UserData, never>({ key: `user/${uuid}`, storage })
}

export function useUser(uuid: Nullable<string>) {
  const storage = useGlobalStorageContext().unwrap()
  const query = useQuery(getUser, [uuid, storage])
  useSubscribe(query, storage)
  return query
}

export function getCurrentUser(storage: GlobalStorage) {
  return createQuery<string, User, never>({ key: `user`, storage })
}

export function useCurrentUserQuery() {
  const storage = useGlobalStorageContext().unwrap()
  const query = useQuery(getCurrentUser, [storage])
  useSubscribe(query, storage)
  return query
}