import { Session } from "@/mods/background/service_worker/entities/sessions/data"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { UserStorage, useUserStorage } from "@/mods/foreground/storage/user"
import { createQuerySchema, useQuery } from "@hazae41/xswr"

export function getSessions(storage: UserStorage) {
  return createQuerySchema<string, Session[], never>({ key: `persistentSessions`, storage })
}

export function useSessions() {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getSessions, [storage])
  useSubscribe(query, storage)
  return query
}

export function getSessionsByWallet(wallet: string, storage: UserStorage) {
  return createQuerySchema<string, Session[], never>({ key: `persistentSessionsByWallet/${wallet}`, storage })
}

export function useSessionsByWallet(wallet: string) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getSessionsByWallet, [wallet, storage])
  useSubscribe(query, storage)
  return query
}