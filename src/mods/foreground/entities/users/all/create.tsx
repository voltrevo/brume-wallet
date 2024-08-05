import { Color } from "@/libs/colors/colors";
import { Emojis } from "@/libs/emojis/emojis";
import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useModhash } from "@/libs/modhash/modhash";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { useConstant } from "@/libs/react/ref";
import { Dialog } from "@/libs/ui/dialog";
import { randomUUID } from "@/libs/uuid/uuid";
import { User, UserInit, UserRef } from "@/mods/background/service_worker/entities/users/data";
import { useBackgroundContext } from "@/mods/foreground/background/context";
import { Data } from "@hazae41/glacier";
import { Some } from "@hazae41/option";
import { useCloseContext } from "@hazae41/react-close-context";
import { KeyboardEvent, useCallback, useDeferredValue, useMemo, useState } from "react";
import { SimpleInput, SimpleLabel, WideShrinkableGradientButton } from "../../wallets/actions/send";
import { useCurrentUser } from "../data";
import { UserAvatar } from "./page";

export function UserCreateDialog(props: { next?: string }) {
  const close = useCloseContext().unwrap()
  const background = useBackgroundContext().unwrap()
  const { next } = props

  const currentUserQuery = useCurrentUser()

  const uuid = useConstant(() => randomUUID())

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

  const createOrAlert = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    const user: UserInit = { uuid, name: finalNameInput, color: Color.all.indexOf(color), emoji, password: defPasswordInput }

    await background.requestOrThrow<User[]>({
      method: "brume_createUser",
      params: [user]
    }).then(r => r.unwrap())

    await background.requestOrThrow({
      method: "brume_login",
      params: [user.uuid, defPasswordInput]
    }).then(r => r.unwrap())

    await currentUserQuery.mutate(() => new Some(new Data(UserRef.create(user.uuid))))

    close(true)

    if (next != null)
      location.assign(next)

    return
  }), [uuid, finalNameInput, color, emoji, defPasswordInput, background, close, next])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Enter")
      return
    e.preventDefault()

    createOrAlert.run()
  }, [createOrAlert])

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
        onChange={onConfirmPasswordInputChange}
        onKeyDown={onKeyDown} />
    </SimpleLabel>

  const DoneButton =
    <WideShrinkableGradientButton
      disabled={error != null}
      onClick={createOrAlert.run}
      color={color}>
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