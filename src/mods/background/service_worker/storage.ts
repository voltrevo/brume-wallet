import { IDBStorage } from "@hazae41/xswr"

export function createGlobalStorage() {
  const storage = IDBStorage.tryCreate("memory").unwrap()

  return { storage }
}
