import { Color } from "@/libs/colors/colors";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useKeyboardEnter } from "@/libs/react/events";
import { PromiseProps } from "@/libs/react/props/promise";
import { User, UserProps } from "@/mods/background/service_worker/entities/users/data";
import { useCallback, useDeferredValue, useRef, useState } from "react";
import { Page } from "../../../../libs/ui2/page/page";
import { useBackgroundContext } from "../../background/context";
import { SimpleLabel } from "../wallets/actions/send";
import { SmallShrinkableContrastButton, SmallShrinkableOppositeButton, UserAvatar2 } from "./all/page";
import { useUser } from "./data";

export function UserLoginPage(props: UserProps & PromiseProps<User, any>) {
  const { user, ok, err } = props

  const background = useBackgroundContext().unwrap()
  const userQuery = useUser(user.uuid)

  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [rawPasswordInput = "", setRawPasswordInput] = useState<string>()

  const defPasswordInput = useDeferredValue(rawPasswordInput)

  const onPasswordInputChange = useInputChange(e => {
    setRawPasswordInput(e.currentTarget.value)
  }, [])

  const [invalid, setInvalid] = useState(false)

  const login = useAsyncUniqueCallback(async () => {
    if (userQuery.data == null)
      return
    if (defPasswordInput.length < 3)
      return

    const response = await background.tryRequest({
      method: "brume_login",
      params: [userQuery.data.get().uuid, defPasswordInput]
    }).then(r => r.unwrap())

    if (response.isErr()) {
      setInvalid(true)

      setTimeout(() => {
        setInvalid(false)
        passwordInputRef.current?.focus()
      }, 500)

      return
    }

    sessionStorage.setItem("uuid", userQuery.data.get().uuid)
    sessionStorage.setItem("password", defPasswordInput)

    ok(userQuery.data.get())
  }, [defPasswordInput, userQuery.data?.get().uuid, background])

  const onKeyDown = useKeyboardEnter<HTMLInputElement>(e => {
    login.run()
  }, [login.run])

  const onLogin = useCallback(() => {
    login.run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [login.run])

  if (userQuery.data == null)
    return null

  return <Page>
    <div className="grow flex justify-center items-center">
      <div className="">
        <div className="flex flex-col items-center">
          <UserAvatar2 className="size-16 text-2xl"
            color={Color.get(userQuery.data.get().color)}
            name={userQuery.data.get().name} />
          <div className="h-2" />
          <div className="font-medium">
            {userQuery.data.get().name}
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
        <div className="flex items-center gap-2">
          <SmallShrinkableContrastButton
            onClick={err}>
            <Outline.ChevronLeftIcon className="size-5" />
            Cancel
          </SmallShrinkableContrastButton>
          <SmallShrinkableOppositeButton
            disabled={defPasswordInput.length < 3 || login.loading}
            onClick={onLogin}>
            <Outline.LockOpenIcon className="size-5" />
            Unlock
          </SmallShrinkableOppositeButton>
        </div>
      </div>
    </div>
  </Page>
}