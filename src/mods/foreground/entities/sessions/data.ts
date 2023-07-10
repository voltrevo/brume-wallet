import { SessionData } from "@/mods/background/service_worker/entities/sessions/data"
import { createQuerySchema, useError, useFetch, useQuery } from "@hazae41/xswr"
import { useUserStorage } from "../../storage/context"
import { UserStorage, useSubscribe } from "../../storage/storage"

export function getSession(name: string, storage: UserStorage) {
  return createQuerySchema<string, SessionData, never>({ key: `sessions/v2/${name}`, storage })
}

export function useSession(name: string) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getSession, [name, storage])
  useFetch(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}