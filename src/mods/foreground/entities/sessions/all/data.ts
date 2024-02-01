import { Session } from "@/mods/background/service_worker/entities/sessions/data"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { createQuery, useQuery } from "@hazae41/glacier"

export function getPersistentSessions(storage: UserStorage) {
  return createQuery<string, Session[], never>({ key: `persistentSessions/v2`, storage })
}

export function usePersistentSessions() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(getPersistentSessions, [storage])

  return query
}

export function getTemporarySessions(storage: UserStorage) {
  return createQuery<string, Session[], never>({ key: `temporarySessions/v2`, storage })
}

export function useTemporarySessions() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(getTemporarySessions, [storage])

  return query
}