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

  const [user, setUser] = useState<User>()
  const clear = useCallback(() => setUser(undefined), [])
  const memo = useObjectMemo({ current: user, clear })

  // const getSession = useCallback(async () => {
  //   return await Result.unthrow<Result>(async t => {
  //     const session = await background
  //       .request<Optional<Session>>({ method: "brume_session" })
  //       .then(r => r.throw(t))

  //     return Ok.void()
  //   })
  // }, [background])

  // useEffect(() => {
  //   background
  //     .request<Optional<Session>>({ method: "brume_session" })
  //     .then(r => setSession(r.unwrap()))
  // }, [background])

  if (user === undefined)
    return <UsersPage ok={setUser} />

  return <UserContext.Provider value={memo}>
    {children}
  </UserContext.Provider>
}