import { useKeyboardEnter } from "@/libs/react/events";
import { useOptionalStringState } from "@/libs/react/handles/string";
import { useAsyncMemo } from "@/libs/react/memo";
import { ChildrenProps } from "@/libs/react/props/children";
import { useCurrentUser } from "@/mods/entities/users/context";
import { Bytes } from "@hazae41/bytes";
import { AesGcmCoder, HmacEncoder, IDBStorage, PBKDF2, StorageQueryParams } from "@hazae41/xswr";
import { createContext, KeyboardEvent, useContext } from "react";

export const UserStorageContext = createContext<StorageQueryParams<any> | undefined>(undefined)

export function useUserStorage() {
  return useContext(UserStorageContext)!
}

export function UserStorageProvider(props: ChildrenProps) {
  const { children } = props

  const user = useCurrentUser()

  const password = useOptionalStringState()

  const storage = useAsyncMemo(async () => {
    if (!user.data) return
    if (!password.current) return

    const storage = IDBStorage.create(user.data.uuid)
    const pbkdf2 = await PBKDF2.from(password.current)

    const keySalt = Bytes.fromBase64(user.data.keySalt)
    const valueSalt = Bytes.fromBase64(user.data.valueSalt)

    const keySerializer = await HmacEncoder.fromPBKDF2(pbkdf2, keySalt)
    const valueSerializer = await AesGcmCoder.fromPBKDF2(pbkdf2, valueSalt)

    return { storage, keySerializer, valueSerializer }
  }, [user.data?.uuid, password.current])

  const onKeyDown = useKeyboardEnter((e: KeyboardEvent<HTMLInputElement>) => {
    password.set(e.currentTarget.value)
  }, [])

  if (!password.current)
    return <>
      <input
        placeholder="Enter a password"
        onKeyDown={onKeyDown} />
    </>

  if (!storage) return <>Loading...</>

  return <UserStorageContext.Provider value={storage}>
    {children}
  </UserStorageContext.Provider>
}