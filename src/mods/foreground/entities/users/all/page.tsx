import { Gradients } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { ClassNameProps } from "@/libs/react/props/className";
import { ColorIndexProps } from "@/libs/react/props/color";
import { NameProps } from "@/libs/react/props/name";
import { OkProps } from "@/libs/react/props/promise";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Loading } from "@/libs/ui/loading/loading";
import { User, UserProps } from "@/mods/background/service_worker/entities/users/data";
import { Page } from "@/mods/foreground/components/page/page";
import { useCallback, useState } from "react";
import { useUser, useUsers } from "../data";
import { UserLoginPage } from "../login";
import { UserCreateDialog } from "./create";

export function UsersPage(props: OkProps<User>) {
  const { ok } = props

  const [user, setUser] = useState<User>()

  const clear = useCallback(() => setUser(undefined), [])

  const users = useUsers()

  const createDialog = useBooleanHandle(false)

  if (user != null)
    return <UserLoginPage
      user={user}
      ok={ok}
      err={clear} />

  if (!users.ready)
    return <div className="grow flex items-center justify-center">
      <Loading className="size-10" />
    </div>

  return <Page>
    <Dialog
      opened={createDialog.current}
      close={createDialog.disable}>
      <UserCreateDialog />
    </Dialog>
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

  const user = useUser(props.user.uuid)

  const onClick = useCallback(() => {
    ok(props.user)
  }, [props.user, ok])

  if (user.data == null)
    return null

  return <button className="flex flex-col items-center"
    onClick={onClick}>
    <UserAvatar className="size-16 text-2xl"
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
    <div className="rounded-full size-16 flex justify-center items-center border border-contrast border-dashed">
      <Outline.PlusIcon className="size-6" />
    </div>
    <div className="h-1" />
    <div className="font-medium">
      New user
    </div>
  </button>
}

export function UserAvatar(props: ClassNameProps & ColorIndexProps & NameProps) {
  const { colorIndex: color, name, className } = props

  const [color1, color2] = Gradients.get(color)

  return <div className={`bg-gradient-to-br from-${color1} to-${color2} rounded-full flex justify-center items-center ${className} text-white`}>
    {name[0]}
  </div>
}