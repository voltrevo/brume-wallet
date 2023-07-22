import { IDBStorage, createQuerySchema } from "@hazae41/xswr"
import { Session } from "../data"

export function getSessions(storage: IDBStorage) {
  return createQuerySchema<string, Session[], never>({ key: `persistentSessions`, storage })
}

export function getSessionsByWallet(wallet: string, storage: IDBStorage) {
  return createQuerySchema<string, Session[], never>({ key: `persistentSessionsByWallet/${wallet}`, storage })
}