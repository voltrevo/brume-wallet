import { useKeyboardEnter } from "@/libs/react/events";
import { useOptionalStringState } from "@/libs/react/handles/string";
import { useAsyncMemo } from "@/libs/react/memo";
import { ChildrenProps } from "@/libs/react/props/children";
import { useCurrentUser } from "@/mods/entities/users/context";
import { Password } from "@/mods/entities/users/password";
import { Bytes } from "@hazae41/bytes";
import { AesGcmCoder, HmacEncoder, IDBStorage, PBKDF2, StorageQueryParams } from "@hazae41/xswr";
import { KeyboardEvent, createContext, useContext } from "react";

export const UserStorageContext = createContext<StorageQueryParams<any> | undefined>(undefined)

export function useUserStorage() {
  return useContext(UserStorageContext)!
}

export function UserStorageProvider(props: ChildrenProps) {
  const { children } = props

  const user = useCurrentUser()

  const password = useOptionalStringState()

  const valid = useAsyncMemo(async () => {
    if (!user.data) return
    if (!password.current) return

    const passwordSaltBytes = Bytes.fromBase64(user.data.passwordSalt)
    const passwordHashBytes = await Password.hash(password.current, passwordSaltBytes)

    const passwordHash = Bytes.toBase64(passwordHashBytes)

    return passwordHash === user.data.passwordHash
  }, [user.data?.uuid, password.current])

  const storage = useAsyncMemo(async () => {
    if (!user.data) return
    if (!password.current) return
    if (!valid) return

    const storage = IDBStorage.create(user.data.uuid)
    const pbkdf2 = await PBKDF2.from(password.current)

    const keySaltBytes = Bytes.fromBase64(user.data.keySalt)
    const valueSaltBytes = Bytes.fromBase64(user.data.valueSalt)

    const keySerializer = await HmacEncoder.fromPBKDF2(pbkdf2, keySaltBytes, 1_000_000)
    const valueSerializer = await AesGcmCoder.fromPBKDF2(pbkdf2, valueSaltBytes, 1_000_000)

    return { storage, keySerializer, valueSerializer }
  }, [user.data?.uuid, password.current, valid])

  const onKeyDown = useKeyboardEnter((e: KeyboardEvent<HTMLInputElement>) => {
    password.set(e.currentTarget.value)
  }, [])

  if (!valid)
    return <>
      <input className="w-full"
        placeholder="Enter your password"
        onKeyDown={onKeyDown} />
      {password.current && <>Invalid password</>}
    </>

  if (!storage) return <>Loading...</>

  return <UserStorageContext.Provider value={storage}>
    {children}
  </UserStorageContext.Provider>
}