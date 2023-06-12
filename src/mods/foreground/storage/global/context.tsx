import { ChildrenProps } from "@/libs/react/props/children";
import { IDBStorage, StorageQueryParams } from "@hazae41/xswr";
import { createContext, useContext, useMemo } from "react";

export const GlobalStorageContext = createContext<StorageQueryParams<any> | undefined>(undefined)

export function useGlobalStorage() {
  return useContext(GlobalStorageContext)!
}

export function GlobalStorageProvider(props: ChildrenProps) {
  const { children } = props

  const storage = useMemo(() => {
    return IDBStorage
      .tryCreate("global")
      .mapSync(storage => ({ storage }))
  }, [])

  if (storage.isErr())
    throw storage.get()

  return <GlobalStorageContext.Provider value={storage.get()}>
    {children}
  </GlobalStorageContext.Provider>
}