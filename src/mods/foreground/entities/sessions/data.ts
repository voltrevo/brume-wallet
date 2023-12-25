import { BgSession, SessionData } from "@/mods/background/service_worker/entities/sessions/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorageContext } from "../../storage/user"

export namespace FgSession {

  export type Key = string
  export type Data = SessionData
  export type Fail = never

  export const key = BgSession.key

  export function shema(id: Nullable<string>, storage: UserStorage) {
    if (id == null)
      return

    return createQuery<Key, Data, Fail>({ key: key(id), storage })
  }

}

export function useSession(id: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgSession.shema, [id, storage])
  useSubscribe(query, storage)
  return query
}