import { SessionData } from "@/mods/background/service_worker/entities/sessions/data"
import { Optional } from "@hazae41/option"
import { createQuerySchema, useQuery } from "@hazae41/xswr"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorage } from "../../storage/user"

export function getTemporarySession(id: Optional<string>, storage: UserStorage) {
  if (id == null)
    return undefined

  return createQuerySchema<string, SessionData, never>({ key: `temporarySession/${id}`, storage })
}

export function useTemporarySession(name: Optional<string>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getTemporarySession, [name, storage])
  useSubscribe(query as any, storage)
  return query
}

export function getPersistentSession(origin: Optional<string>, storage: UserStorage) {
  if (origin == null)
    return undefined

  return createQuerySchema<string, SessionData, never>({ key: `persistentSession/${origin}`, storage })
}

export function usePersistentSession(origin: Optional<string>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getPersistentSession, [origin, storage])
  useSubscribe(query as any, storage)
  return query
}