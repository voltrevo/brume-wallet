import { Color } from "@/libs/colors/colors";
import { Errors } from "@/libs/errors/errors";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange } from "@/libs/react/events";
import { useCloseContext } from "@/libs/ui/dialog/dialog";
import { Data } from "@hazae41/glacier";
import { Some } from "@hazae41/option";
import { KeyboardEvent, useCallback, useDeferredValue, useRef, useState } from "react";
import { useBackgroundContext } from "../../background/context";
import { usePathState, useSearchState } from "../../router/path/context";
import { SimpleLabel, WideShrinkableContrastButton, WideShrinkableOppositeButton } from "../wallets/actions/send";
import { UserAvatar } from "./all/page";
import { useCurrentUser, useUser } from "./data";

export function UserLoginDialog() {
  const close = useCloseContext().unwrap()
  const background = useBackgroundContext().unwrap()

  const $state = usePathState<{ user: string }>()
  const [maybeUserId] = useSearchState("user", $state)

  const userQuery = useUser(maybeUserId)
  const maybeUser = userQuery.current?.ok().get()

  const currentUserQuery = useCurrentUser()

  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [rawPasswordInput = "", setRawPasswordInput] = useState<string>()

  const defPasswordInput = useDeferredValue(rawPasswordInput)

  const onPasswordInputChange = useInputChange(e => {
    setRawPasswordInput(e.currentTarget.value)
  }, [])

  const [invalid, setInvalid] = useState(false)

  const login = useAsyncUniqueCallback(() => Errors.runAndLogAndAlert(async () => {
    if (maybeUser == null)
      return
    if (defPasswordInput.length < 3)
      return

    const response = await background.tryRequest({
      method: "brume_login",
      params: [maybeUser.uuid, defPasswordInput]
    }).then(r => r.unwrap())

    if (response.isErr()) {
      setInvalid(true)

      setTimeout(() => {
        setInvalid(false)
        passwordInputRef.current?.focus()
      }, 500)

      return
    }

    sessionStorage.setItem("uuid", maybeUser.uuid)
    sessionStorage.setItem("password", defPasswordInput)

    await currentUserQuery.mutate(() => new Some(new Data(maybeUser)))

    location.assign("#/home")
  }), [defPasswordInput, userQuery.data?.get().uuid, background])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Enter")
      return
    e.preventDefault()

    login.run()
  }, [login])

  const onLogin = useCallback(() => {
    login.run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [login.run])

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
          <input className="bg-transparent outline-none min-w-0 disabled:text-contrast data-[invalid=true]:border-red-500 data-[invalid=true]:text-red-500"
            ref={passwordInputRef}
            type="password"
            value={rawPasswordInput}
            onChange={onPasswordInputChange}
            disabled={login.loading}
            data-invalid={invalid}
            placeholder="Password"
            onKeyDown={onKeyDown}
            autoFocus />
        </SimpleLabel>
        <div className="h-2" />
        <div className="flex items-center flex-wrap-reverse gap-2">
          <WideShrinkableContrastButton
            onClick={close}>
            <Outline.ChevronLeftIcon className="size-5" />
            Cancel
          </WideShrinkableContrastButton>
          <WideShrinkableOppositeButton
            disabled={defPasswordInput.length < 3 || login.loading}
            onClick={onLogin}>
            <Outline.LockOpenIcon className="size-5" />
            Unlock
          </WideShrinkableOppositeButton>
        </div>
      </div>
    </div>
  </>
}