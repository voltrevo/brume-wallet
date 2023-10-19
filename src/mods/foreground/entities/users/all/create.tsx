import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { CloseProps } from "@/libs/react/props/close";
import { useConstant } from "@/libs/react/ref";
import { Button } from "@/libs/ui/button";
import { Dialog } from "@/libs/ui/dialog/dialog";
import { Input } from "@/libs/ui/input";
import { Mutators } from "@/libs/xswr/mutators";
import { UserInit } from "@/mods/background/service_worker/entities/users/data";
import { useBackground } from "@/mods/foreground/background/context";
import { useDeferredValue, useMemo, useState } from "react";
import { User } from "../data";
import { useUsers } from "./data";
import { UserAvatar } from "./page";

export function UserCreateDialog(props: CloseProps) {
  const { close } = props
  const background = useBackground().unwrap()

  const users = useUsers()

  const uuid = useConstant(() => crypto.randomUUID())

  const modhash = useModhash(uuid)
  const color = Colors.mod(modhash)
  const emoji = Emojis.get(modhash)

  const [rawNameInput = "", setRawNameInput] = useState<string>()

  const defNameInput = useDeferredValue(rawNameInput)

  const onNameInputChange = useInputChange(e => {
    setRawNameInput(e.currentTarget.value)
  }, [])

  const [rawPasswordInput = "", setRawPasswordInput] = useState<string>()

  const defPasswordInput = useDeferredValue(rawPasswordInput)

  const onPasswordInputChange = useInputChange(e => {
    setRawPasswordInput(e.currentTarget.value)
  }, [])

  const [rawConfirmPasswordInput = "", setRawConfirmPasswordInput] = useState<string>()

  const defConfirmPasswordInput = useDeferredValue(rawConfirmPasswordInput)

  const onConfirmPasswordInputChange = useInputChange(e => {
    setRawConfirmPasswordInput(e.currentTarget.value)
  }, [])

  const isSamePassword = useMemo(() => {
    return defPasswordInput === defConfirmPasswordInput
  }, [defPasswordInput, defConfirmPasswordInput])

  const onClick = useAsyncUniqueCallback(async () => {
    const user: UserInit = { uuid, name: defNameInput, color, emoji, password: defPasswordInput }

    const usersData = await background
      .tryRequest<User[]>({ method: "brume_createUser", params: [user] })
      .then(r => r.unwrap().unwrap())

    users.mutate(Mutators.data(usersData))

    close()
  }, [uuid, defNameInput, color, emoji, defPasswordInput, background, users.mutate, close])

  const NameInput =
    <div className="flex items-stretch gap-2">
      <div className="shrink-0">
        <UserAvatar className="s-5xl text-2xl"
          colorIndex={color}
          name={defNameInput} />
      </div>
      <Input.Contrast className="w-full"
        placeholder="Enter a name"
        value={rawNameInput}
        onChange={onNameInputChange} />
    </div>

  const PasswordInput =
    <Input.Contrast className="w-full"
      type="password"
      placeholder="Enter a password"
      value={rawPasswordInput}
      onChange={onPasswordInputChange} />

  const PasswordInput2 =
    <Input.Contrast className="w-full"
      type="password"
      placeholder="Confirm the password"
      value={rawConfirmPasswordInput}
      onChange={onConfirmPasswordInputChange} />

  const DoneButton =
    <Button.Gradient className="w-full po-md"
      colorIndex={color}
      disabled={!defNameInput || !defPasswordInput || !defConfirmPasswordInput || !isSamePassword}
      onClick={onClick.run}>
      <Button.Shrinker>
        <Outline.PlusIcon className="s-sm" />
        Add
      </Button.Shrinker>
    </Button.Gradient>

  return <Dialog close={close}>
    <Dialog.Title close={close}>
      New user
    </Dialog.Title>
    <div className="h-2" />
    {NameInput}
    <div className="h-4" />
    {PasswordInput}
    <div className="h-2" />
    {PasswordInput2}
    <div className="h-4" />
    {DoneButton}
  </Dialog>
}