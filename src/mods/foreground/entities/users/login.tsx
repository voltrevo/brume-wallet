import { Outline } from "@/libs/icons/icons";
import { useAsyncUniqueCallback } from "@/libs/react/callback";
import { useKeyboardEnter } from "@/libs/react/events";
import { PromiseProps } from "@/libs/react/props/promise";
import { Bytes } from "@hazae41/bytes";
import { Err, Ok } from "@hazae41/result";
import { AesGcmCoder, HmacEncoder, IDBStorage, StorageQueryParams } from "@hazae41/xswr";
import { useRef, useState } from "react";
import { Pbdkf2Params } from "../../storage/user/crypto";
import { UserAvatar } from "./all/page";
import { UserData, UserProps, useUser } from "./data";

async function tryValidate(user: UserData, password: string) {
  const pbkdf2 = await crypto.subtle.importKey("raw", Bytes.fromUtf8(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"])

  const passwordHashBase64 = user.passwordHashBase64
  const passwordParamsBase64 = user.passwordParamsBase64
  const passwordParamsBytes = Pbdkf2Params.parse(passwordParamsBase64)
  const passwordHashLength = Bytes.fromBase64(passwordHashBase64).length * 8

  const currentPasswordHashBytes = new Uint8Array(await crypto.subtle.deriveBits(passwordParamsBytes, pbkdf2, passwordHashLength))
  const currentPasswordHashBase64 = Bytes.toBase64(currentPasswordHashBytes)

  if (currentPasswordHashBase64 !== passwordHashBase64)
    return new Err(new Error(`Invalid password`))

  const storage = IDBStorage.tryCreate(user.uuid)

  if (storage.isErr())
    return storage

  const keyParamsBytes = Pbdkf2Params.parse(user.keyParamsBase64.algorithm)
  const valueParamsBytes = Pbdkf2Params.parse(user.valueParamsBase64.algorithm)

  const keyKey = await crypto.subtle.deriveKey(keyParamsBytes, pbkdf2, user.keyParamsBase64.derivedKeyType, false, ["sign"])
  const valueKey = await crypto.subtle.deriveKey(valueParamsBytes, pbkdf2, user.valueParamsBase64.derivedKeyType, false, ["encrypt", "decrypt"])

  const keySerializer = new HmacEncoder(keyKey)
  const valueSerializer = new AesGcmCoder(valueKey)

  return new Ok({ storage: storage.get(), keySerializer, valueSerializer })
}

export function UserLoginPage(props: UserProps & PromiseProps<StorageQueryParams<any>>) {
  const { user: userRef, ok, err } = props

  const user = useUser(userRef.uuid)

  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [invalid, setInvalid] = useState(false)

  const validate = useAsyncUniqueCallback(async (password: string) => {
    if (user.data === undefined)
      return
    if (password?.length < 3)
      return

    const result = await tryValidate(user.data.inner, password)

    if (result.isOk())
      return ok(result.get())

    setInvalid(true)

    setTimeout(() => {
      setInvalid(false)
      passwordInputRef.current?.focus()
    }, 500)
  }, [user.data?.inner.uuid])

  const onKeyDown = useKeyboardEnter<HTMLInputElement>(e => {
    validate.run(e.currentTarget.value)
  }, [])

  if (user.data === undefined)
    return null

  return <>
    <div className="h-full w-full flex flex-col justify-center items-center">
      <div className="grow flex flex-col justify-center items-center">
        <div className="flex flex-col items-center">
          <UserAvatar className="icon-7xl text-2xl"
            colorIndex={user.data.inner.color}
            name={user.data.inner.name} />
          <div className="h-1" />
          <div className="font-medium">
            {user.data.inner.name}
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