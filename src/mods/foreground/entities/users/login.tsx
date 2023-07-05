import { Button } from "@/libs/components/button";
import { Input } from "@/libs/components/input";
import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useInputChange, useKeyboardEnter } from "@/libs/react/events";
import { PromiseProps } from "@/libs/react/props/promise";
import { useCallback, useRef, useState } from "react";
import { useBackground } from "../../background/context";
import { Page } from "../../components/page/page";
import { UserAvatar } from "./all/page";
import { User, UserProps, useUser } from "./data";

export function UserLoginPage(props: UserProps & PromiseProps<User, any>) {
  const { user, ok, err } = props

  const background = useBackground()
  const userQuery = useUser(user.uuid, background)

  const [password = "", setPassword] = useState<string>()
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const onPasswordChange = useInputChange(e => {
    setPassword(e.currentTarget.value)
  }, [])

  const [invalid, setInvalid] = useState(false)

  const login = useAsyncUniqueCallback(async () => {
    if (userQuery.data == null)
      return
    if (password?.length < 3)
      return

    const response = await background.tryRequest({
      method: "brume_setCurrentUser",
      params: [userQuery.data.inner.uuid, password]
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
    sessionStorage.setItem("password", password)

    ok(userQuery.data.inner)
  }, [password, userQuery.data?.inner.uuid, background])

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
          <UserAvatar className="icon-7xl text-2xl"
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
          value={password}
          onChange={onPasswordChange}
          disabled={login.loading}
          data-invalid={invalid}
          placeholder="Password"
          onKeyDown={onKeyDown} />
        <div className="h-2" />
        <div className="flex items-center gap-2">
          <Button.Contrast className="grow p-sm hovered-or-clicked:scale-105 transition-transform"
            onClick={err}>
            <Button.Shrink>
              <Outline.ChevronLeftIcon className="icon-sm" />
              Cancel
            </Button.Shrink>
          </Button.Contrast>
          <Button.Opposite className="grow p-sm hovered-or-clicked:scale-105 transition-transform"
            onClick={onLogin}>
            <Button.Shrink>
              <Outline.LockOpenIcon className="icon-sm" />
              Unlock
            </Button.Shrink>
          </Button.Opposite>
        </div>
      </div>

    </div>
  </Page>
}