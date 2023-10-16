import { ChildrenProps } from "@/libs/react/props/children";
import { Mutators } from "@/libs/xswr/mutators";
import { Nullable } from "@hazae41/option";
import { createContext, useCallback, useContext } from "react";
import { UsersPage } from "./all/page";
import { User, useCurrentUserQuery } from "./data";

export const UserContext = createContext<Nullable<User>>(undefined)

export function useCurrentUserRef() {
  return useContext(UserContext)!
}

export function UserGuard(props: ChildrenProps) {
  const { children } = props

  const userQuery = useCurrentUserQuery()

  const setCurrentUser = useCallback((user: User) => {
    userQuery.mutate(Mutators.data(user))
  }, [userQuery])

  if (userQuery.current == null)
    return <UsersPage ok={setCurrentUser} />

  return <UserContext.Provider value={userQuery.current.inner}>
    {children}
  </UserContext.Provider>
}