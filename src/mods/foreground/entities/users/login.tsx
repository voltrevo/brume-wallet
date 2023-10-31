import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useKeyboardEnter } from "@/libs/react/events";
import { PromiseProps } from "@/libs/react/props/promise";
import { Button } from "@/libs/ui/button";
import { Input } from "@/libs/ui/input";
import { useCallback, useDeferredValue, useRef, useState } from "react";
import { useBackgroundContext } from "../../background/context";
import { Page } from "../../components/page/page";
import { UserAvatar } from "./all/page";
import { User, UserProps, useUser } from "./data";

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
    if (defPasswordInput?.length < 3)
      return

    const response = await background.tryRequest({
      method: "brume_login",
      params: [userQuery.data.inner.uuid, defPasswordInput]
    }).then(r => r.unwrap())

    if (response.isErr()) {
      setInvalid(true)

      setTimeout(() => {
        setInvalid(false)
        passwordInputRef.current?.focus()
      }, 500)

      return
    }

    sessionStorage.setItem("uuid", userQuery.data.inner.uuid)
    sessionStorage.setItem("password", defPasswordInput)

    ok(userQuery.data.inner)
  }, [defPasswordInput, userQuery.data?.inner.uuid, background])

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
          <UserAvatar className="s-7xl text-2xl"
            colorIndex={userQuery.data.inner.color}
            name={userQuery.data.inner.name} />
          <div className="h-1" />
          <div className="font-medium">
            {userQuery.data.inner.name}
          </div>
        </div>
        <div className="h-4" />
        <Input.Contrast className="data-[invalid=true]:border-red-500 data-[invalid=true]:text-red-500"
          xref={passwordInputRef}
          type="password" autoFocus
          value={rawPasswordInput}
          onChange={onPasswordInputChange}
          disabled={login.loading}
          data-invalid={invalid}
          placeholder="Password"
          onKeyDown={onKeyDown} />
        <div className="h-2" />
        <div className="flex items-center gap-2">
          <Button.Contrast className="grow po-sm hovered-or-clicked-or-focused:scale-105 !transition-transform"
            onClick={err}>
            <div className={`${Button.Shrinker.className}`}>
              <Outline.ChevronLeftIcon className="s-sm" />
              Cancel
            </div>
          </Button.Contrast>
          <Button.Opposite className="grow po-sm hovered-or-clicked-or-focused:scale-105 !transition-transform"
            onClick={onLogin}>
            <div className={`${Button.Shrinker.className}`}>
              <Outline.LockOpenIcon className="s-sm" />
              Unlock
            </div>
          </Button.Opposite>
        </div>
      </div>

    </div>
  </Page>
}