import { useBooleanState } from "@/libs/react/handles/boolean";
import { OkProps } from "@/libs/react/props/promise";
import { useCallback } from "react";
import { User, UserProps } from "../data";
import { UserCreateDialog } from "./create";
import { useUsers } from "./data";

export function UsersPage(props: OkProps<User>) {
  const { ok } = props

  const users = useUsers()

  const createDialog = useBooleanState()

  return <>
    {createDialog.current &&
      <UserCreateDialog
        close={createDialog.disable} />}
    {users.data?.map(user =>
      <UserButton
        key={user.uuid}
        user={user}
        ok={ok} />)}
    <button onClick={createDialog.enable}>
      New user
    </button>
  </>
}

function UserButton(props: UserProps & OkProps<User>) {
  const { user, ok } = props

  const onClick = useCallback(() => {
    ok(user)
  }, [user, ok])

  return <button onClick={onClick}>
    {user.uuid}
  </button>
}