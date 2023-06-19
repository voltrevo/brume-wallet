import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useKeyboardEnter } from "@/libs/react/events";
import { PromiseProps } from "@/libs/react/props/promise";
import { MouseEvent, useRef, useState } from "react";
import { useBackground } from "../../background/context";
import { Page } from "../../components/page/page";
import { UserAvatar } from "./all/page";
import { User, UserProps, useUser } from "./data";

export function UserLoginPage(props: UserProps & PromiseProps<User, MouseEvent>) {
  const { user, ok, err } = props

  const background = useBackground()
  const userQuery = useUser(user.uuid, background)

  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [invalid, setInvalid] = useState(false)

  const login = useAsyncUniqueCallback(async (password: string) => {
    if (userQuery.data === undefined)
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

    ok(userQuery.data.inner)
  }, [userQuery.data?.inner.uuid, background])

  const onKeyDown = useKeyboardEnter<HTMLInputElement>(e => {
    login.run(e.currentTarget.value)
  }, [login.run])

  if (userQuery.data === undefined)
    return null

  return <Page>
    <div className="grow flex flex-col justify-center items-center">
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
      <input className={`p-xmd rounded-xl outline-none bg-transparent border border-contrast focus:border-opposite data-[invalid=true]:border-red-500 data-[invalid=true]:text-red-500`}
        ref={passwordInputRef}
        type="password" autoFocus
        disabled={login.loading}
        data-invalid={invalid}
        placeholder="Password"
        onKeyDown={onKeyDown} />
    </div>
    <div className="h-8" />
    <div className="flex justify-center p-4">
      <button className="flex flex-col items-center gap-2"
        onClick={err}>
        <div className="rounded-full icon-5xl flex justify-center items-center border border-contrast">
          <Outline.XMarkIcon className="icon-lg" />
        </div>
        <div className="font-medium">
          Cancel
        </div>
      </button>
    </div>
  </Page>
}