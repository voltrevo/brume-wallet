import { Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { useSubscribe } from "@/mods/foreground/storage/storage";
import { UserStorage, useUserStorage } from "@/mods/foreground/storage/user";
import { createQuery, useQuery } from "@hazae41/glacier";

export function getWallets(storage: UserStorage) {
  return createQuery<string, Wallet[], never>({ key: `wallets`, storage })
}

export function useWallets() {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getWallets, [storage])
  useSubscribe(query, storage)
  return query
}