import { IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr"
import { User, getUserRef } from "../data"

export function getUsers(storage: IDBStorage) {
  const normalizer = async (users: User[], more: NormalizerMore) =>
    await Promise.all(users.map(user => getUserRef(user, storage, more)))

  return createQuerySchema<string, User[], never>(`users`, undefined, { storage: { storage }, normalizer })
}