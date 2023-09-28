import { IDBStorage, createQuery } from "@hazae41/glacier"
import { User } from "../data"

export namespace Users {

  export type Key = typeof key

  export const key = `users`

  export type Schema = ReturnType<typeof schema>

  export function schema(storage: IDBStorage) {
    return createQuery<Key, User[], never>({ key, storage })
  }

}