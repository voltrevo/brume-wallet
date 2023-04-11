import { ChildrenProps } from "@/libs/react/props/children";
import { SingleQuery } from "@hazae41/xswr";
import { createContext, useContext, useState } from "react";
import { UsersPage } from "./all/page";
import { User, UserData, useUser } from "./data";

export const UserContext = createContext<SingleQuery<UserData, string> | undefined>(undefined)

export function useCurrentUser() {
  return useContext(UserContext)!
}

export function UserProvider(props: ChildrenProps) {
  const { children } = props

  const [userRef, setUser] = useState<User>()

  const user = useUser(userRef?.uuid)

  if (!userRef)
    return <UsersPage ok={setUser} />

  return <UserContext.Provider value={user}>
    {children}
  </UserContext.Provider>
}