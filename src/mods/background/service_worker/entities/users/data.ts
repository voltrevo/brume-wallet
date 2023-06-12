import { Optional } from "@hazae41/option"
import { NormalizerMore, StorageQueryParams, createQuerySchema } from "@hazae41/xswr"
import { AesGcmPbkdf2ParamsBase64, HmacPbkdf2ParamsBase64, Pbkdf2ParamsBase64 } from "./crypto"

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

export function getUser(uuid: Optional<string>, storage: Optional<StorageQueryParams<any>>) {
  if (uuid === undefined)
    return undefined
  if (storage === undefined)
    return undefined

  return createQuerySchema<UserData>(`user/${uuid}`, undefined, { storage })
}

export async function getUserRef(wallet: User, storage: Optional<StorageQueryParams<any>>, more: NormalizerMore) {
  if ("ref" in wallet) return wallet

  const schema = getUser(wallet.uuid, storage)
  await schema?.normalize(wallet, more)

  return { ref: true, uuid: wallet.uuid } as UserRef
}