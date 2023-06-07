import { useGlobalStorage } from "@/mods/foreground/storage/global/context";
import { getSchema, NormalizerMore, StorageQueryParams, useSchema } from "@hazae41/xswr";
import { getUserRef, User } from "../data";

export function getUsers(storage: StorageQueryParams<any> | undefined) {
  if (!storage) return

  const normalizer = async (users: User[], more: NormalizerMore) => {
    return await Promise.all(users.map(user => getUserRef(user, storage, more)))
  }

  return getSchema<User[]>(`users`, undefined, { storage, normalizer })
}

export function useUsers() {
  const storage = useGlobalStorage()

  return useSchema(getUsers, [storage])
}