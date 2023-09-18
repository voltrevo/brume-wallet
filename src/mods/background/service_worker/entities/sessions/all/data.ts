import { IDBStorage, createQuerySchema } from "@hazae41/xswr"
import { SessionRef } from "../data"

export namespace TemporarySessions {

  export type Key = typeof key

  export const key = `temporarySessions/v2`

  export type Schema = ReturnType<typeof schema>

  export function schema() {
    return createQuerySchema<Key, SessionRef[], never>({ key })
  }

}

export namespace TemporarySessionsByWallet {

  export type Key = ReturnType<typeof key>

  export function key(wallet: string) {
    return `temporarySessionsByWallet/v2/${wallet}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(wallet: string) {
    return createQuerySchema<Key, SessionRef[], never>({ key: key(wallet) })
  }

}

export namespace PersistentSessions {

  export type Key = typeof key

  export const key = `persistentSessions/v2`

  export type Schema = ReturnType<typeof schema>

  export function schema(storage: IDBStorage) {
    return createQuerySchema<Key, SessionRef[], never>({ key, storage })
  }

}

export namespace PersistentSessionsByWallet {

  export type Key = ReturnType<typeof key>

  export function key(wallet: string) {
    return `persistentSessionsByWallet/v2/${wallet}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(wallet: string, storage: IDBStorage) {
    return createQuerySchema<Key, SessionRef[], never>({ key: key(wallet), storage })
  }

}
