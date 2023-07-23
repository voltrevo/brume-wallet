import { IDBStorage, createQuerySchema } from "@hazae41/xswr"
import { SessionRef } from "../data"

export namespace Sessions {

  export type Schema = ReturnType<typeof schema>

  export function schema(storage: IDBStorage) {
    return createQuerySchema<string, SessionRef[], never>({ key: `persistentSessions`, storage })
  }

}

export namespace SessionsByWallet {

  export type Schema = ReturnType<typeof schema>

  export function schema(wallet: string, storage: IDBStorage) {
    return createQuerySchema<string, SessionRef[], never>({ key: `persistentSessionsByWallet/${wallet}`, storage })
  }

}
