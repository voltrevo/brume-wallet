import { ChildrenProps } from "@/libs/react/props/children";
import { Option, Optional, Some } from "@hazae41/option";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useBackground } from "../../background/context";
import { UsersPage } from "./all/page";
import { User, UserData } from "./data";

export const UserContext = createContext<Optional<User>>(undefined)

export function useCurrentUser() {
  return useContext(UserContext)!
}

export function UserProvider(props: ChildrenProps) {
  const { children } = props

  const background = useBackground()

  const [user, setUser] = useState<Option<User>>()
  const set = useCallback((user: User) => setUser(new Some(user)), [])

  useEffect(() => {
    background
      .request<Optional<UserData>>({ method: "brume_getCurrentUser", params: undefined })
      .then(r => setUser(Option.from(r.unwrap())))
  }, [background])

  if (user === undefined)
    return null

  if (user.isNone())
    return <UsersPage ok={set} />

  return <UserContext.Provider value={user.inner}>
    {children}
  </UserContext.Provider>
}