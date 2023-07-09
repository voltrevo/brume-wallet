import { SessionData } from "@/mods/background/service_worker/entities/sessions/data"
import { createQuerySchema, useError, useFetch, useQuery } from "@hazae41/xswr"
import { useUserStorage } from "../../storage/context"
import { UserStorage, useSubscribe } from "../../storage/storage"

export function getSession(origin: string, storage: UserStorage) {
  return createQuerySchema<string, SessionData, never>({ key: `sessions/${origin}`, storage })
}

export function useSession(origin: string) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getSession, [origin, storage])
  useFetch(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}