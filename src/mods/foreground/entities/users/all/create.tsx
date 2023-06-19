import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Outline } from "@/libs/icons/icons";
import { Dialog, DialogTitle } from "@/libs/modals/dialog";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { Mutators } from "@/libs/xswr/mutators";
import { UserInit } from "@/mods/background/service_worker/entities/users/data";
import { useBackground } from "@/mods/foreground/background/context";
import { InnerButton } from "@/mods/foreground/components/buttons/button";
import { GradientButton } from "@/mods/foreground/components/buttons/gradient";
import { useMemo, useState } from "react";
import { User } from "../data";
import { useUsers } from "./data";
import { UserAvatar } from "./page";

export function UserCreateDialog(props: CloseProps) {
  const { close } = props

  const background = useBackground()
  const users = useUsers(background)

  const uuid = useMemo(() => {
    return crypto.randomUUID()
  }, [])

  const modhash = useModhash(uuid)
  const color = Colors.mod(modhash)
  const emoji = Emojis.get(modhash)

  const [name = "", setName] = useState<string>()

  const onNameChange = useInputChange(e => {
    setName(e.currentTarget.value)
  }, [])

  const [password = "", setPassword] = useState<string>()

  const onPasswordChange = useInputChange(e => {
    setPassword(e.currentTarget.value)
  }, [])

  const [password2 = "", setPassword2] = useState<string>()

  const onPassword2Change = useInputChange(e => {
    setPassword2(e.currentTarget.value)
  }, [])

  const isSamePassword = useMemo(() => {
    return password === password2
  }, [password, password2])

  const onClick = useAsyncUniqueCallback(async () => {
    const user: UserInit = { uuid, name, color, emoji, password }

    const usersData = await background
      .tryRequest<User[]>({ method: "brume_newUser", params: [user] })
      .then(r => r.unwrap().unwrap())

    users.mutate(Mutators.data(usersData))

    close()
  }, [uuid, name, color, emoji, password, background, users.mutate, close])

  const NameInput =
    <div className="flex items-center gap-2">
      <div className="shrink-0">
        <UserAvatar className="icon-5xl text-2xl"
          colorIndex={color}
          name={name} />
      </div>
      <input className="p-xmd w-full rounded-xl outline-none bg-transparent border border-contrast focus:border-opposite"
        placeholder="Name"
        value={name} onChange={onNameChange} />
    </div>

  const PasswordInput =
    <input className="p-xmd w-full rounded-xl outline-none bg-transparent border border-contrast focus:border-opposite"
      type="password"
      placeholder="Password"
      value={password} onChange={onPasswordChange} />

  const PasswordInput2 =
    <input className="p-xmd w-full rounded-xl outline-none bg-transparent border border-contrast focus:border-opposite"
      type="password"
      placeholder="Confirm password"
      value={password2} onChange={onPassword2Change} />

  const DoneButton =
    <GradientButton className="w-full"
      colorIndex={color}
      disabled={!name || !password || !password2 || !isSamePassword}
      onClick={onClick.run}>
      <InnerButton icon={Outline.PlusIcon}>
        Add
      </InnerButton>
    </GradientButton>

  return <Dialog close={close}>
    <DialogTitle close={close}>
      New user
    </DialogTitle>
    <div className="h-2" />
    {NameInput}
    <div className="h-2" />
    {PasswordInput}
    <div className="h-2" />
    {PasswordInput2}
    <div className="h-4" />
    {DoneButton}
  </Dialog>
}