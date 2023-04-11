import { useAsyncUniqueCallback } from "@/libs/react/async";
import { useKeyboardEnter } from "@/libs/react/events";
import { ChildrenProps } from "@/libs/react/props/children";
import { UserAvatar } from "@/mods/entities/users/all/page";
import { useCurrentUser } from "@/mods/entities/users/context";
import { Password } from "@/mods/entities/users/password";
import { Bytes } from "@hazae41/bytes";
import { AesGcmCoder, HmacEncoder, IDBStorage, PBKDF2, StorageQueryParams } from "@hazae41/xswr";
import { KeyboardEvent, createContext, useContext, useRef, useState } from "react";

export const UserStorageContext = createContext<StorageQueryParams<any> | undefined>(undefined)

export function useUserStorage() {
  return useContext(UserStorageContext)!
}

export function UserStorageProvider(props: ChildrenProps) {
  const { children } = props

  const user = useCurrentUser()

  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [invalid, setInvalid] = useState(false)
  const [storage, setStorage] = useState<StorageQueryParams<any>>()

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

    setStorage({ storage, keySerializer, valueSerializer })
  }, [user.data?.uuid])

  const onKeyDown = useKeyboardEnter((e: KeyboardEvent<HTMLInputElement>) => {
    validate.run(e.currentTarget.value)
  }, [])

  if (!user.data) return null

  if (!storage)
    return <div className="h-full w-full flex flex-col justify-center items-center">
      <div className="flex flex-col items-center">
        <UserAvatar className="icon-7xl text-2xl"
          uuid={user.data.uuid}
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
        placeholder="Enter your password"
        onKeyDown={onKeyDown} />
    </div>

  return <UserStorageContext.Provider value={storage}>
    {children}
  </UserStorageContext.Provider>
}