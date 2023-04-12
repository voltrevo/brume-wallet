import { ChildrenProps } from "@/libs/react/props/children";
import { useCurrentUser } from "@/mods/entities/users/context";
import { UserPage } from "@/mods/entities/users/page";
import { StorageQueryParams } from "@hazae41/xswr";
import { createContext, useContext, useState } from "react";

export const UserStorageContext = createContext<StorageQueryParams<any> | undefined>(undefined)

export function useUserStorage() {
  return useContext(UserStorageContext)!
}

export function UserStorageProvider(props: ChildrenProps) {
  const { children } = props

  const user = useCurrentUser()

  const [storage, setStorage] = useState<StorageQueryParams<any>>()

  if (!user.current)
    return null

  if (!storage)
    return <UserPage
      user={user.current}
      ok={setStorage}
      err={user.clear} />

  return <UserStorageContext.Provider value={storage}>
    {children}
  </UserStorageContext.Provider>
}