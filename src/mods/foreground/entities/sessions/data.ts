import { SessionData } from "@/mods/background/service_worker/entities/sessions/data"
import { createQuerySchema, useQuery } from "@hazae41/xswr"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorage } from "../../storage/user"

export function getSession(id: string, storage: UserStorage) {
  return createQuerySchema<string, SessionData, never>({ key: `session/v3/${id}`, storage })
}

export function useSession(name: string) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getSession, [name, storage])
  useSubscribe(query, storage)
  return query
}