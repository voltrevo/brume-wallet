import { useObjectMemo } from "@/libs/react/memo";
import { ChildrenProps } from "@/libs/react/props/children";
import { None, Option } from "@hazae41/option";
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

  const [user, setUser] = useState<Option<User>>()
  const clear = useCallback(() => setUser(new None()), [])
  const memo = useObjectMemo({ current: user?.inner, clear })

  if (user === undefined)
    return null

  if (user.isNone())
    return <UsersPage ok={setUser} />

  return <UserContext.Provider value={memo}>
    {children}
  </UserContext.Provider>
}