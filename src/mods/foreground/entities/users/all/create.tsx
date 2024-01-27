import { Color } from "@/libs/colors/colors";
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
import { SimpleInput, SimpleLabel, WideShrinkableGradientButton } from "../../wallets/actions/send";
import { useUsers } from "../data";
import { UserAvatar } from "./page";

export function UserCreateDialog(props: {}) {
  const close = useCloseContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const users = useUsers()

  const uuid = useConstant(() => crypto.randomUUID())

  const modhash = useModhash(uuid)
  const color = Color.get(modhash)
  const emoji = Emojis.get(modhash)

  const [rawNameInput = "", setRawNameInput] = useState<string>()

  const defNameInput = useDeferredValue(rawNameInput)

  const finalNameInput = useMemo(() => {
    return defNameInput || "John Doe"
  }, [defNameInput])

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

  const onClick = useAsyncUniqueCallback(async () => {
    const user: UserInit = { uuid, name: finalNameInput, color: Color.all.indexOf(color), emoji, password: defPasswordInput }

    const usersData = await background
      .tryRequest<User[]>({ method: "brume_createUser", params: [user] })
      .then(r => r.unwrap().unwrap())

    users.mutate(Mutators.data(usersData))

    close()
  }, [uuid, finalNameInput, color, emoji, defPasswordInput, background, users.mutate, close])

  const error = useMemo(() => {
    if (defPasswordInput.length < 3)
      return "Password is required"
    if (defConfirmPasswordInput.length < 3)
      return "Confirm the password"
    if (defPasswordInput !== defConfirmPasswordInput)
      return "Passwords are not the same"
  }, [defConfirmPasswordInput, defPasswordInput])

  const NameInput =
    <SimpleLabel>
      <div className="shrink-0">
        Name
      </div>
      <div className="w-4" />
      <SimpleInput
        placeholder="John Doe"
        value={rawNameInput}
        onChange={onNameInputChange} />
    </SimpleLabel>

  const PasswordInput =
    <SimpleLabel>
      <div className="shrink-0">
        Password
      </div>
      <div className="w-4" />
      <SimpleInput
        type="password"
        placeholder=""
        value={rawPasswordInput}
        onChange={onPasswordInputChange} />
    </SimpleLabel>

  const PasswordInput2 =
    <SimpleLabel>
      <div className="shrink-0">
        Password
      </div>
      <div className="w-4" />
      <SimpleInput
        type="password"
        placeholder=""
        value={rawConfirmPasswordInput}
        onChange={onConfirmPasswordInputChange} />
    </SimpleLabel>

  const DoneButton =
    <WideShrinkableGradientButton
      color={color}
      disabled={error != null}
      onClick={onClick.run}>
      <Outline.PlusIcon className="size-5" />
      {error || "Add"}
    </WideShrinkableGradientButton>

  return <>
    <Dialog.Title>
      New user
    </Dialog.Title>
    <div className="h-4" />
    <div className="grow flex flex-col items-center justify-center">
      <UserAvatar className="size-16 text-2xl"
        name={finalNameInput}
        color={color} />
      <div className="h-2" />
      <div className="font-medium">
        {finalNameInput}
      </div>
    </div>
    <div className="h-2" />
    {NameInput}
    <div className="h-2" />
    {PasswordInput}
    <div className="h-2" />
    {PasswordInput2}
    <div className="h-4" />
    <div className="flex items-center flex-wrap-reverse gap-2">
      {DoneButton}
    </div>
  </>
}