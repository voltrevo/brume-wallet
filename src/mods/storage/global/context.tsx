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
    const storage = IDBStorage.create("global")

    return { storage }
  }, [])

  return <GlobalStorageContext.Provider value={storage}>
    {children}
  </GlobalStorageContext.Provider>
}