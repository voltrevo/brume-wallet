import { useObjectMemo } from "@/libs/react/memo";
import { ChildrenProps } from "@/libs/react/props/children";
import { createContext, useCallback, useContext, useState } from "react";
import { UsersPage } from "./all/page";
import { User } from "./data";

export interface UserHandle {
  current?: User,
  clear(): void
}

export const UserContext = createContext<UserHandle | undefined>(undefined)

export function useCurrentUser() {
  return useContext(UserContext)!
}

export function UserProvider(props: ChildrenProps) {
  const { children } = props

  const [current, setUser] = useState<User>()
  const clear = useCallback(() => setUser(undefined), [])
  const user = useObjectMemo({ current, clear })

  if (!current)
    return <UsersPage ok={setUser} />

  return <UserContext.Provider value={user}>
    {children}
  </UserContext.Provider>
}