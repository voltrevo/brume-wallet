import { Optional } from "@hazae41/option"
import { NormalizerMore, StorageQueryParams, createQuerySchema } from "@hazae41/xswr"
import { User, getUserRef } from "../data"

export function getUsers(storage: Optional<StorageQueryParams<any>>) {
  if (storage === undefined)
    return undefined

  const normalizer = async (users: User[], more: NormalizerMore) =>
    await Promise.all(users.map(user => getUserRef(user, storage, more)))

  return createQuerySchema<User[]>(`users`, undefined, { storage, normalizer })
}