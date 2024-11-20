import { Color } from "@/libs/colors/colors";
import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { UserRef } from "@/mods/background/service_worker/entities/users/data";
import { usePathContext } from "@hazae41/chemin";
import { Data } from "@hazae41/glacier";
import { Some } from "@hazae41/option";
import { useCloseContext } from "@hazae41/react-close-context";
import { KeyboardEvent, useCallback, useDeferredValue, useRef, useState } from "react";
import { useBackgroundContext } from "../../background/context";
import { SimpleLabel, WideShrinkableContrastButton, WideShrinkableOppositeButton } from "../wallets/actions/send";
import { UserAvatar } from "./all/page";
import { useCurrentUser, useUser } from "./data";

export function UserLoginDialog(props: { next?: string }) {
  const path = usePathContext().getOrThrow()
  const close = useCloseContext().getOrThrow()
  const background = useBackgroundContext().getOrThrow()
  const { next } = props

  const maybeUserId = path.url.searchParams.get("user")

  const userQuery = useUser(maybeUserId)
  const maybeUser = userQuery.current?.getOrNull()

  const currentUserQuery = useCurrentUser()

  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [rawPasswordInput = "", setRawPasswordInput] = useState<string>()

  const defPasswordInput = useDeferredValue(rawPasswordInput)

  const onPasswordInputChange = useInputChange(e => {
    setRawPasswordInput(e.currentTarget.value)
  }, [])

  const [invalid, setInvalid] = useState(false)

  const loginOrAlert = useAsyncUniqueCallback(() => Errors.runOrLogAndAlert(async () => {
    if (maybeUser == null)
      return
    const user = maybeUser

    if (defPasswordInput.length < 3)
      return

    const response = await background.requestOrThrow({
      method: "brume_login",
      params: [user.uuid, defPasswordInput]
    })

    if (response.isErr()) {
      setInvalid(true)

      setTimeout(() => {
        setInvalid(false)
        passwordInputRef.current?.focus()
      }, 500)

      return
    }

    await currentUserQuery.mutateOrThrow(() => new Some(new Data(UserRef.create(user.uuid))))

    close(true)

    if (next != null)
      location.assign(next)

    return
  }), [defPasswordInput, maybeUser, background, close, next])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Enter")
      return
    e.preventDefault()

    loginOrAlert.run()
  }, [loginOrAlert])

  const onCancel = useCallback(() => {
    close()
  }, [close])

  const onLogin = useCallback(() => {
    loginOrAlert.run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginOrAlert.run])

  if (maybeUser == null)
    return null

  return <>
    <div className="grow flex justify-center items-center">
      <div className="">
        <div className="flex flex-col items-center">
          <UserAvatar className="size-16 text-2xl"
            color={Color.get(maybeUser.color)}
            name={maybeUser.name} />
          <div className="h-2" />
          <div className="font-medium">
            {maybeUser.name}
          </div>
        </div>
        <div className="h-4" />
        <SimpleLabel>
          <input className="bg-transparent outline-none min-w-0 disabled:text-contrast data-[invalid=true]:border-red-400 data-[invalid=true]:text-red-400 dark:data-[invalid=true]:border-red-500 dark:data-[invalid=true]:text-red-500"
            ref={passwordInputRef}
            type="password"
            value={rawPasswordInput}
            onChange={onPasswordInputChange}
            disabled={loginOrAlert.loading}
            data-invalid={invalid}
            placeholder="Password"
            onKeyDown={onKeyDown}
            autoFocus />
        </SimpleLabel>
        <div className="h-2" />
        <div className="flex items-center flex-wrap-reverse gap-2">
          <WideShrinkableContrastButton
            onClick={onCancel}>
            <Outline.ChevronLeftIcon className="size-5" />
            Cancel
          </WideShrinkableContrastButton>
          <WideShrinkableOppositeButton
            disabled={defPasswordInput.length < 3 || loginOrAlert.loading}
            onClick={onLogin}>
            <Outline.LockOpenIcon className="size-5" />
            Login
          </WideShrinkableOppositeButton>
        </div>
      </div>
    </div>
  </>
}