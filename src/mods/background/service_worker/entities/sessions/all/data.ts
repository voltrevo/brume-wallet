import { IDBStorage, createQuerySchema } from "@hazae41/xswr"
import { Session } from "../data"

export function getSessions(storage: IDBStorage) {
  return createQuerySchema<string, Session[], never>({ key: `sessions/v3`, storage })
}

export function getSessionsByWallet(wallet: string, storage: IDBStorage) {
  return createQuerySchema<string, Session[], never>({ key: `sessionsByWallet/${wallet}`, storage })
}