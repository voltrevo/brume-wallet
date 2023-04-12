import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useKeyboardEnter } from "@/libs/react/events";
import { PromiseProps } from "@/libs/react/props/promise";
import { Bytes } from "@hazae41/bytes";
import { AesGcmCoder, HmacEncoder, IDBStorage, PBKDF2, StorageQueryParams } from "@hazae41/xswr";
import { useRef, useState } from "react";
import { UserAvatar } from "./all/page";
import { UserProps, useUser } from "./data";
import { Password } from "./password";

export function UserPage(props: UserProps & PromiseProps<StorageQueryParams<any>>) {
  const { user: userRef, ok, err } = props

  const user = useUser(userRef.uuid)

  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [invalid, setInvalid] = useState(false)

  const validate = useAsyncUniqueCallback(async (password: string) => {
    if (!user.data) return
    if (!password) return

    const passwordSaltBytes = Bytes.fromBase64(user.data.passwordSalt)
    const passwordHashBytes = await Password.hash(password, passwordSaltBytes)

    const passwordHash = Bytes.toBase64(passwordHashBytes)

    if (passwordHash !== user.data.passwordHash) {
      setInvalid(true)

      setTimeout(() => {
        setInvalid(false)
        passwordInputRef.current?.focus()
      }, 500)

      return
    }

    const storage = IDBStorage.create(user.data.uuid)
    const pbkdf2 = await PBKDF2.from(password)

    const keySaltBytes = Bytes.fromBase64(user.data.keySalt)
    const valueSaltBytes = Bytes.fromBase64(user.data.valueSalt)

    const keySerializer = await HmacEncoder.fromPBKDF2(pbkdf2, keySaltBytes, 1_000_000)
    const valueSerializer = await AesGcmCoder.fromPBKDF2(pbkdf2, valueSaltBytes, 1_000_000)

    ok({ storage, keySerializer, valueSerializer })
  }, [user.data?.uuid])

  const onKeyDown = useKeyboardEnter<HTMLInputElement>(e => {
    validate.run(e.currentTarget.value)
  }, [])

  if (!user.data) return null

  return <>
    <div className="h-full w-full flex flex-col justify-center items-center">
      <div className="grow flex flex-col justify-center items-center">
        <div className="flex flex-col items-center">
          <UserAvatar className="icon-7xl text-2xl"
            modhash={user.data.modhash}
            name={user.data.name} />
          <div className="h-1" />
          <div className="font-medium">
            {user.data.name}
          </div>
        </div>
        <div className="h-4" />
        <input className={`p-xmd rounded-xl outline-none bg-transparent border border-contrast focus:border-opposite data-[invalid=true]:border-red-500 data-[invalid=true]:text-red-500`}
          ref={passwordInputRef}
          type="password" autoFocus
          disabled={validate.loading}
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
    </div>
  </>
}