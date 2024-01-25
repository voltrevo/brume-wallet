import { Colors } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Mutators } from "@/libs/glacier/mutators";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { Dialog, useCloseContext } from "@/libs/ui/dialog/dialog";
import { User, UserInit } from "@/mods/background/service_worker/entities/users/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { useDeferredValue, useMemo, useState } from "react";
import { SimpleBox, SimpleInput, WideBox, WideShrinkableGradientButton } from "../../wallets/actions/send";
import { useUsers } from "../data";
import { UserAvatar } from "./page";

export function UserCreateDialog(props: {}) {
  const close = useCloseContext().unwrap()
  const background = useBackgroundContext().unwrap()

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

  const error = useMemo(() => {
    if (!defNameInput)
      return "Name is required"
    if (!defPasswordInput)
      return "Password is required"
    if (!defConfirmPasswordInput)
      return "Confirm the password"
    if (!isSamePassword)
      return "Passwords are not the same"
  }, [defConfirmPasswordInput, defNameInput, defPasswordInput, isSamePassword])

  const NameInput =
    <div className="flex items-center gap-2">
      <div className="shrink-0">
        <UserAvatar className="size-12 text-2xl"
          colorIndex={color}
          name={defNameInput} />
      </div>
      <WideBox>
        <SimpleInput
          placeholder="Enter a name"
          value={rawNameInput}
          onChange={onNameInputChange} />
      </WideBox>
    </div>

  const PasswordInput =
    <SimpleBox>
      <SimpleInput
        type="password"
        placeholder="Enter a password"
        value={rawPasswordInput}
        onChange={onPasswordInputChange} />
    </SimpleBox>

  const PasswordInput2 =
    <SimpleBox>
      <SimpleInput
        type="password"
        placeholder="Confirm the password"
        value={rawConfirmPasswordInput}
        onChange={onConfirmPasswordInputChange} />
    </SimpleBox>

  const DoneButton =
    <WideShrinkableGradientButton
      color="emerald"
      disabled={error != null}
      onClick={onClick.run}>
      <Outline.PlusIcon className="size-5" />
      {error || "Add"}
    </WideShrinkableGradientButton>

  return <>
    <Dialog.Title>
      New user
    </Dialog.Title>
    <div className="h-2" />
    {NameInput}
    <div className="h-4" />
    {PasswordInput}
    <div className="h-2" />
    {PasswordInput2}
    <div className="h-4 grow" />
    <div className="flex items-center">
      {DoneButton}
    </div>
  </>
}