import { Gradients } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { useBooleanHandle } from "@/libs/react/handles/boolean";
import { ClassNameProps } from "@/libs/react/props/className";
import { ColorIndexProps } from "@/libs/react/props/color";
import { NameProps } from "@/libs/react/props/name";
import { OkProps } from "@/libs/react/props/promise";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { useBackgroundContext } from "@/mods/foreground/background/context";
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

  const users = useUsers()

  const createDialog = useBooleanHandle(false)

  if (user != null)
    return <UserLoginPage
      user={user}
      ok={ok}
      err={clear} />

  if (!users.ready)
    return <div className="grow flex items-center justify-center">
      <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
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

  const background = useBackgroundContext().unwrap()
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