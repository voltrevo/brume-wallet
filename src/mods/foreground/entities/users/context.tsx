import { ChildrenProps } from "@/libs/react/props/children";
import { UserData } from "@/mods/background/service_worker/entities/users/data";
import { Nullable, Option } from "@hazae41/option";
import { createContext, useContext, useMemo } from "react";
import { EmptyLandingPage } from "../../landing";
import { useCurrentUser, useUser } from "./data";

export const UserContext = createContext<Nullable<Option<UserData>>>(undefined)

export function useUserContext() {
  return Option.wrap(useContext(UserContext))
}

export function UserProvider(props: ChildrenProps) {
  const { children } = props

  const currentUserQuery = useCurrentUser()
  const maybeCurrentUser = currentUserQuery.data?.get()

  const userQuery = useUser(maybeCurrentUser?.uuid)
  const maybeUser = userQuery.data?.get()

  const wrappedUser = useMemo(() => {
    return Option.wrap(maybeUser)
  }, [maybeUser])

  if (!currentUserQuery.ready)
    return <>{children}</>

  return <UserContext.Provider value={wrappedUser}>
    {children}
  </UserContext.Provider>
}

export function UserGuardPage(props: ChildrenProps) {
  const maybeUser = useUserContext().getOrNull()
  const { children } = props

  if (maybeUser == null)
    return <EmptyLandingPage />

  return <>{children}</>
}