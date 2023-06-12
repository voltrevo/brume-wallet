import { IDBStorage } from "@hazae41/xswr"

export function tryCreateGlobalStorage() {
  return IDBStorage
    .tryCreate("memory")
    .mapSync(storage => ({ storage }))
}
