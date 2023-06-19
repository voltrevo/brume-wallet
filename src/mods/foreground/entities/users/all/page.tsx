import { Colors } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { ClassNameProps } from "@/libs/react/props/className";
import { OkProps } from "@/libs/react/props/promise";
import { useBackground } from "@/mods/foreground/background/context";
import { Page } from "@/mods/foreground/components/page/page";
import { useCallback, useState } from "react";
import { User, UserProps, useUser } from "../data";
import { UserLoginPage } from "../login";
import { UserCreateDialog } from "./create";
import { useUsers } from "./data";

export function UsersPage(props: OkProps<User>) {
  const { ok } = props

  const [user, setUser] = useState<User>()
  const clear = useCallback(() => setUser(undefined), [])

  const background = useBackground()
  const users = useUsers(background)

  const createDialog = useBooleanHandle(false)

  if (user !== undefined)
    return <UserLoginPage
      user={user}
      ok={ok}
      err={clear} />

  return <Page>
    {createDialog.current &&
      <UserCreateDialog
        close={createDialog.disable} />}
    <div className="grid grow place-items-center place-content-center grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] auto-rows-[10rem]">
      {users.data?.inner.map(user =>
        <UserOkButton
          key={user.uuid}
          user={user}
          ok={setUser} />)}
      <NewUserButton ok={createDialog.enable} />
    </div>
  </Page>
}

function UserOkButton(props: UserProps & OkProps<User>) {
  const { ok } = props

  const background = useBackground()
  const user = useUser(props.user.uuid, background)

  const onClick = useCallback(() => {
    ok(props.user)
  }, [props.user, ok])

  if (user.data === undefined)
    return null

  return <button className="flex flex-col items-center"
    onClick={onClick}>
    <UserAvatar className="icon-7xl text-2xl"
      colorIndex={user.data.inner.color}
      name={user.data.inner.name} />
    <div className="h-1" />
    <div className="font-medium">
      {user.data.inner.name}
    </div>
  </button>
}

function NewUserButton(props: OkProps<unknown>) {
  const { ok } = props

  return <button className="flex flex-col items-center"
    onClick={ok}>
    <div className="rounded-full icon-7xl flex justify-center items-center border border-contrast border-dashed">
      <Outline.PlusIcon className="icon-md" />
    </div>
    <div className="h-1" />
    <div className="font-medium">
      New user
    </div>
  </button>
}

export function UserAvatar(props: ClassNameProps & {
  colorIndex: number,
  name: string
}) {
  const { colorIndex, name, className } = props

  const color1 = Colors.get(colorIndex)
  const color2 = Colors.get(colorIndex + 1)

  return <div className={`bg-gradient-to-br from-${color1} to-${color2} rounded-full flex justify-center items-center ${className} text-white`}>
    {name[0]}
  </div>
}