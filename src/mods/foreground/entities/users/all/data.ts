import { GlobalStorage, useGlobalStorage } from "@/mods/foreground/storage/global";
import { useSubscribe } from "@/mods/foreground/storage/storage";
import { createQuerySchema, useQuery } from "@hazae41/xswr";
import { User } from "../data";

export function getUsers(storage: GlobalStorage) {
  return createQuerySchema<string, User[], never>({ key: `users`, storage })
}

export function useUsers() {
  const storage = useGlobalStorage().unwrap()
  const query = useQuery(getUsers, [storage])
  useSubscribe(query, storage)
  return query
}