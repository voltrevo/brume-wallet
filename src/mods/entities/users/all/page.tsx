import { useColor } from "@/libs/colors/color";
import { Outline } from "@/libs/icons/icons";
import { useBooleanState } from "@/libs/react/handles/boolean";
import { ClassNameProps } from "@/libs/react/props/className";
import { OkProps } from "@/libs/react/props/promise";
import { useCallback } from "react";
import { User, UserDataProps, UserProps, useUser } from "../data";
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
    <div className="h-full w-full flex justify-center items-center">
      <div className="flex flex-wrap gap-8">
        {users.data?.map(user =>
          <UserOkButton
            key={user.uuid}
            user={user}
            ok={ok} />)}
        <NewUserButton ok={createDialog.enable} />
      </div>
    </div>
  </>
}

function UserOkButton(props: UserProps & OkProps<User>) {
  const { user, ok } = props

  const { data } = useUser(user.uuid)

  const onClick = useCallback(() => {
    ok(user)
  }, [user, ok])

  if (!data) return null

  return <button className="flex flex-col items-center"
    onClick={onClick}>
    <UserAvatar className="icon-7xl text-2xl"
      user={data} />
    <div className="font-medium">
      {data.name}
    </div>
  </button>
}

function NewUserButton(props: OkProps<unknown>) {
  const { ok } = props

  return <button className="flex flex-col items-center"
    onClick={ok}>
    <div className="rounded-full icon-7xl flex justify-center items-center border border-contrast border-dashed">
      <Outline.PlusIcon className="icon-sm" />
    </div>
    <div className="font-medium">
      New user
    </div>
  </button>
}

export function UserAvatar(props: UserDataProps & ClassNameProps) {
  const { user, className } = props

  const color = useColor(user.uuid)

  return <div className={`${color} rounded-full flex justify-center items-center ${className} text-white`}>
    {user.name[0]}
  </div>
}