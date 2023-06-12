import { useGlobalStorage } from "@/mods/foreground/storage/global/context";
import { NormalizerMore, StorageQueryParams, createQuerySchema, useQuery } from "@hazae41/xswr";
import { User, getUserRef } from "../data";

export function getUsers(storage: StorageQueryParams<any> | undefined) {
  if (!storage) return

  const normalizer = async (users: User[], more: NormalizerMore) => {
    return await Promise.all(users.map(user => getUserRef(user, storage, more)))
  }

  return createQuerySchema<User[]>(`users`, undefined, { storage, normalizer })
}

export function useUsers() {
  const storage = useGlobalStorage()

  return useQuery(getUsers, [storage])
}