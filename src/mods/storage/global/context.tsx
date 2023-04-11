import { useAsyncMemo } from "@/libs/react/memo";
import { ChildrenProps } from "@/libs/react/props/children";
import { IDBStorage, StorageQueryParams } from "@hazae41/xswr";
import { createContext, useContext } from "react";

export const GlobalStorageContext = createContext<StorageQueryParams<any> | undefined>(undefined)

export function useGlobalStorage() {
  return useContext(GlobalStorageContext)!
}

export function GlobalStorageProvider(props: ChildrenProps) {
  const { children } = props

  const storage = useAsyncMemo(async () => {
    const storage = IDBStorage.create("global")

    return { storage }
  }, [])

  if (!storage) return <>Loading...</>

  return <GlobalStorageContext.Provider value={storage}>
    {children}
  </GlobalStorageContext.Provider>
}