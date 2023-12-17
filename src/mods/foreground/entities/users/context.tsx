import { Mutators } from "@/libs/glacier/mutators";
import { ChildrenProps } from "@/libs/react/props/children";
import { Nullable, Option } from "@hazae41/option";
import { createContext, useCallback, useContext } from "react";
import { UsersPage } from "./all/page";
import { User, UserData, useCurrentUserQuery, useUser } from "./data";

export const UserContext = createContext<Nullable<UserData>>(undefined)

export function useUserContext() {
  return Option.wrap(useContext(UserContext))
}

export function UserGuard(props: ChildrenProps) {
  const { children } = props

  const currentUserQuery = useCurrentUserQuery()
  const currentUserData = currentUserQuery.data?.inner

  const setCurrentUser = useCallback((user: User) => {
    currentUserQuery.mutate(Mutators.data(user))
  }, [currentUserQuery])

  const userQuery = useUser(currentUserData?.uuid)
  const userData = userQuery.data?.inner

  if (userData == null)
    return <UsersPage ok={setCurrentUser} />

  return <UserContext.Provider value={userData}>
    {children}
  </UserContext.Provider>
}