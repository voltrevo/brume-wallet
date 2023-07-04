import { ChildrenProps } from "@/libs/react/props/children";
import { Mutators } from "@/libs/xswr/mutators";
import { Optional } from "@hazae41/option";
import { useOnce, useQuery, useVisible } from "@hazae41/xswr";
import { createContext, useCallback, useContext } from "react";
import { useBackground } from "../../background/context";
import { UsersPage } from "./all/page";
import { User, getCurrentUser } from "./data";

export const UserContext = createContext<Optional<User>>(undefined)

export function useCurrentUser() {
  return useContext(UserContext)!
}

export function UserProvider(props: ChildrenProps) {
  const { children } = props

  const background = useBackground()

  const userQuery = useQuery(getCurrentUser, [background])

  const setCurrentUser = useCallback((user: User) => {
    userQuery.mutate(Mutators.data(user))
  }, [userQuery])

  useOnce(userQuery)
  useVisible(userQuery)

  if (userQuery.current == null)
    return null

  if (userQuery.current.isErr())
    throw userQuery.current.inner

  if (userQuery.current.inner == null)
    return <UsersPage ok={setCurrentUser} />

  return <UserContext.Provider value={userQuery.current.inner}>
    {children}
  </UserContext.Provider>
}