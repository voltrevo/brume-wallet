import { IDBStorage, StorageQuerySettings } from "@hazae41/xswr"

export type GlobalStorage =
  StorageQuerySettings<any, never>

export function tryCreateGlobalStorage() {
  return IDBStorage
    .tryCreate("memory")
    .mapSync(storage => ({ storage }))
}
