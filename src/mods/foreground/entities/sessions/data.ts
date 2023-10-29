import { SessionData } from "@/mods/background/service_worker/entities/sessions/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorageContext } from "../../storage/user"

export function getSession(id: Nullable<string>, storage: UserStorage) {
  if (id == null)
    return undefined

  return createQuery<string, SessionData, never>({ key: `session/v4/${id}`, storage })
}

export function useSession(id: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(getSession, [id, storage])
  useSubscribe(query as any, storage)
  return query
}