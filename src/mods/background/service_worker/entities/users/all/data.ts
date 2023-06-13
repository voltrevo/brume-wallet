import { NormalizerMore, StorageQuerySettings, createQuerySchema } from "@hazae41/xswr"
import { User, getUserRef } from "../data"

export function getUsers(storage: StorageQuerySettings<any, never>) {
  const normalizer = async (users: User[], more: NormalizerMore) =>
    await Promise.all(users.map(user => getUserRef(user, storage, more)))

  return createQuerySchema<string, User[], never>(`users`, undefined, { storage, normalizer })
}