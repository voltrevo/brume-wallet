import { Result } from "@hazae41/result"
import { IDBStorage } from "@hazae41/xswr"

export interface GlobalStorage {
  storage: IDBStorage
}

export function tryCreateGlobalStorage(): Result<GlobalStorage, Error> {
  return IDBStorage.tryCreate("memory").mapSync(storage => ({ storage }))
}
