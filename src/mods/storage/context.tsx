import { useKeyboardEnter } from "@/libs/react/events";
import { useOptionalStringState } from "@/libs/react/handles/string";
import { useAsyncMemo } from "@/libs/react/memo";
import { ChildrenProps } from "@/libs/react/props/children";
import { Bytes } from "@hazae41/bytes";
import { AesGcmCoder, HmacEncoder, IDBStorage, PBKDF2, StorageQueryParams } from "@hazae41/xswr";
import { createContext, KeyboardEvent, useContext } from "react";

export const StorageContext = createContext<StorageQueryParams<any> | undefined>(undefined)

export function useStorage() {
  return useContext(StorageContext)!
}

function getOrCreateSalt(key: string) {
  const item = localStorage.getItem(key)

  if (item)
    return Bytes.fromBase64(item)

  const salt = Bytes.random(16)
  localStorage.setItem(key, Bytes.toBase64(salt))
  return salt
}

export function StorageProvider(props: ChildrenProps) {
  const { children } = props

  const password = useOptionalStringState()

  const storage = useAsyncMemo(async () => {
    if (!password.current) return

    const storage = IDBStorage.create("storage")
    const pbkdf2 = await PBKDF2.from(password.current)

    const keySalt = getOrCreateSalt("keySalt")
    const valueSalt = getOrCreateSalt("valueSalt")

    const keySerializer = await HmacEncoder.fromPBKDF2(pbkdf2, keySalt)
    const valueSerializer = await AesGcmCoder.fromPBKDF2(pbkdf2, valueSalt)

    return { storage, keySerializer, valueSerializer }
  }, [password.current])

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

  return <StorageContext.Provider value={storage}>
    {children}
  </StorageContext.Provider>
}