import { Optional } from "@hazae41/option"
import { Fetched, IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr"
import { User } from "../data"

export namespace Users {

  export type Key = typeof key

  export const key = `users`

  export type Schema = ReturnType<typeof schema>

  export function schema(storage: IDBStorage) {
    const normalizer = async (fetched: Optional<Fetched<User[], never>>, more: NormalizerMore) =>
      fetched?.map(async users => await Promise.all(users.map(user => User.normalize(user, storage, more))))

    return createQuerySchema<Key, User[], never>({ key, storage, normalizer })
  }

}