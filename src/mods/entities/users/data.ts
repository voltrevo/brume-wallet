import { useGlobalStorage } from "@/mods/storage/global/context"
import { getSchema, NormalizerMore, StorageQueryParams, useSchema } from "@hazae41/xswr"

export type User =
  | UserRef
  | UserData

export interface UserProps {
  user: User
}

export interface UserDataProps {
  user: UserData
}

export interface UserRef {
  ref: true
  uuid: string
}

export interface UserData {
  name: string,
  uuid: string,

  keySalt: string,

  valueSalt: string

  passwordSalt: string
  passwordHash: string
}

export function getUserSchema(uuid: string | undefined, storage: StorageQueryParams<any> | undefined) {
  if (!uuid || !storage) return

  return getSchema<UserData>(`user/${uuid}`, undefined, { storage })
}

export async function getUserRef(wallet: User, storage: StorageQueryParams<any> | undefined, more: NormalizerMore) {
  if ("ref" in wallet) return wallet

  const schema = getUserSchema(wallet.uuid, storage)
  await schema?.normalize(wallet, more)

  return { ref: true, uuid: wallet.uuid } as UserRef
}

export function useUser(uuid: string | undefined) {
  const storage = useGlobalStorage()

  return useSchema(getUserSchema, [uuid, storage])
}