import { ChildrenProps } from "@/libs/react/props/children";
import { UserData } from "@/mods/background/service_worker/entities/users/data";
import { Nullable, Option } from "@hazae41/option";
import { createContext, useContext } from "react";
import { EmptyLandingPage } from "./all/page";
import { useCurrentUser, useUser } from "./data";

export const UserContext = createContext<Nullable<UserData>>(undefined)

export function useUserContext() {
  return Option.wrap(useContext(UserContext))
}

export function UserGuard(props: ChildrenProps) {
  const { children } = props

  const currentUserQuery = useCurrentUser()
  const maybeCurrentUser = currentUserQuery.data?.get()

  const userQuery = useUser(maybeCurrentUser?.uuid)
  const maybeUser = userQuery.data?.get()

  if (!currentUserQuery.ready)
    return null

  if (maybeCurrentUser == null)
    return <EmptyLandingPage />

  if (maybeUser == null)
    return null

  return <UserContext.Provider value={maybeUser}>
    {children}
  </UserContext.Provider>
}