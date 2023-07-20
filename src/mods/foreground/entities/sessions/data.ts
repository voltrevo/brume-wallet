import { SessionData } from "@/mods/background/service_worker/entities/sessions/data"
import { createQuerySchema, useError, useFetch, useQuery } from "@hazae41/xswr"
import { UserStorage, useSubscribe } from "../../storage/storage"
import { useUserStorage } from "../../storage/user"

export function getSession(id: string, storage: UserStorage) {
  return createQuerySchema<string, SessionData, never>({ key: `session/v3/${id}`, storage })
}

export function useSession(name: string) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getSession, [name, storage])
  useFetch(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}