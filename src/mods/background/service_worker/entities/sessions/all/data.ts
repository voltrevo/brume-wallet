import { IDBStorage, createQuerySchema } from "@hazae41/xswr"
import { SessionRef } from "../data"

export namespace Sessions {

  export type Key = typeof key

  export const key = `persistentSessions`

  export type Schema = ReturnType<typeof schema>

  export function schema(storage: IDBStorage) {
    return createQuerySchema<Key, SessionRef[], never>({ key, storage })
  }

}

export namespace SessionsByWallet {

  export type Key = ReturnType<typeof key>

  export function key(wallet: string) {
    return `persistentSessionsByWallet/${wallet}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(wallet: string, storage: IDBStorage) {
    return createQuerySchema<Key, SessionRef[], never>({ key: key(wallet), storage })
  }

}
