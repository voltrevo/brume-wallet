import { Mutators } from "@/libs/glacier/mutators";
import { ChildrenProps } from "@/libs/react/props/children";
import { User, UserData } from "@/mods/background/service_worker/entities/users/data";
import { Nullable, Option } from "@hazae41/option";
import { createContext, useCallback, useContext } from "react";
import { UsersPage2 } from "./all/page";
import { useCurrentUser, useUser } from "./data";

export const UserContext = createContext<Nullable<UserData>>(undefined)

export function useUserContext() {
  return Option.wrap(useContext(UserContext))
}

export function UserGuard(props: ChildrenProps) {
  const { children } = props

  const currentUserQuery = useCurrentUser()
  const currentUserData = currentUserQuery.data?.get()

  const setCurrentUser = useCallback((user: User) => {
    currentUserQuery.mutate(Mutators.data(user))
  }, [currentUserQuery])

  const userQuery = useUser(currentUserData?.uuid)
  const userData = userQuery.data?.get()

  if (userData == null)
    return <UsersPage2 ok={setCurrentUser} />

  return <UserContext.Provider value={userData}>
    {children}
  </UserContext.Provider>
}