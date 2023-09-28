import { GlobalStorage, useGlobalStorage } from "@/mods/foreground/storage/global";
import { useSubscribe } from "@/mods/foreground/storage/storage";
import { createQuery, useQuery } from "@hazae41/glacier";
import { User } from "../data";

export function getUsers(storage: GlobalStorage) {
  return createQuery<string, User[], never>({ key: `users`, storage })
}

export function useUsers() {
  const storage = useGlobalStorage().unwrap()
  const query = useQuery(getUsers, [storage])
  useSubscribe(query, storage)
  return query
}