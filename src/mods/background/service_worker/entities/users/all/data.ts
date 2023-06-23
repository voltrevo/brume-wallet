import { Optional } from "@hazae41/option"
import { Fetched, IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr"
import { User, getUserRef } from "../data"

export function getUsers(storage: IDBStorage) {
  const normalizer = async (fetched: Optional<Fetched<User[], never>>, more: NormalizerMore) =>
    fetched?.map(async users => await Promise.all(users.map(user => getUserRef(user, storage, more))))

  return createQuerySchema<string, User[], never>(`users`, undefined, { storage, normalizer })
}