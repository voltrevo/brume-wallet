import { Session } from "@/mods/background/service_worker/entities/sessions/data"
import { useUserStorage } from "@/mods/foreground/storage/context"
import { UserStorage, useSubscribe } from "@/mods/foreground/storage/storage"
import { createQuerySchema, useError, useFetch, useQuery } from "@hazae41/xswr"

export function getSessions(storage: UserStorage) {
  return createQuerySchema<string, Session[], never>({ key: `sessions/v3`, storage })
}

export function useSessions() {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getSessions, [storage])
  useFetch(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}

export function getSessionsByWallet(wallet: string, storage: UserStorage) {
  return createQuerySchema<string, Session[], never>({ key: `sessionsByWallet/${wallet}`, storage })
}

export function useSessionsByWallet(wallet: string) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getSessionsByWallet, [wallet, storage])
  useFetch(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}