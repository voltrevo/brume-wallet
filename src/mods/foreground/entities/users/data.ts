import { useGlobalStorage } from "@/mods/foreground/storage/global/context"
import { NormalizerMore, StorageQueryParams, createQuerySchema, useQuery } from "@hazae41/xswr"
import { AesGcmPbkdf2ParamsBase64, HmacPbkdf2ParamsBase64, Pbkdf2ParamsBase64 } from "../../storage/user/crypto"

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
  uuid: string,
  name: string,

  color: number
  emoji: string

  keyParamsBase64: HmacPbkdf2ParamsBase64
  valueParamsBase64: AesGcmPbkdf2ParamsBase64

  passwordParamsBase64: Pbkdf2ParamsBase64
  passwordHashBase64: string
}

export function getUserSchema(uuid: string | undefined, storage: StorageQueryParams<any> | undefined) {
  if (!uuid || !storage) return

  return createQuerySchema<UserData>(`user/${uuid}`, undefined, { storage })
}

export async function getUserRef(wallet: User, storage: StorageQueryParams<any> | undefined, more: NormalizerMore) {
  if ("ref" in wallet) return wallet

  const schema = getUserSchema(wallet.uuid, storage)
  await schema?.normalize(wallet, more)

  return { ref: true, uuid: wallet.uuid } as UserRef
}

export function useUser(uuid: string | undefined) {
  const storage = useGlobalStorage()

  return useQuery(getUserSchema, [uuid, storage])
}