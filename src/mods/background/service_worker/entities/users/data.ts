import { Bytes } from "@hazae41/bytes"
import { Optional } from "@hazae41/option"
import { Ok, Result } from "@hazae41/result"
import { NormalizerMore, StorageQueryParams, createQuerySchema } from "@hazae41/xswr"
import { AesGcmPbkdf2ParamsBase64, HmacPbkdf2ParamsBase64, Pbdkf2Params, Pbkdf2ParamsBase64, Pbkdf2ParamsBytes } from "./crypto"

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

export interface UserInit {
  uuid: string,
  name: string,

  color: number
  emoji: string

  password: string
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

export async function tryCreateUser(init: UserInit): Promise<Result<UserData, Error>> {
  return await Result.unthrow(async t => {
    const { uuid, name, color, emoji, password } = init

    const pbkdf2 = await crypto.subtle.importKey("raw", Bytes.fromUtf8(password), { name: "PBKDF2" }, false, ["deriveBits"])

    const keyParamsBase64: HmacPbkdf2ParamsBase64 = {
      derivedKeyType: {
        name: "HMAC",
        hash: "SHA-256"
      },
      algorithm: Pbdkf2Params.stringify({
        name: "PBKDF2",
        hash: "SHA-256",
        iterations: 1_000_000,
        salt: Bytes.tryRandom(16).throw(t)
      })
    }

    const valueParamsBase64: AesGcmPbkdf2ParamsBase64 = {
      derivedKeyType: {
        name: "AES-GCM",
        length: 256
      },
      algorithm: Pbdkf2Params.stringify({
        name: "PBKDF2",
        hash: "SHA-256",
        iterations: 1_000_000,
        salt: Bytes.tryRandom(16).throw(t)
      })
    }

    const passwordParamsBytes: Pbkdf2ParamsBytes = {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: 1_000_000,
      salt: Bytes.tryRandom(16).throw(t)
    }

    const passwordParamsBase64 = Pbdkf2Params.stringify(passwordParamsBytes)
    const passwordHashBytes = new Uint8Array(await crypto.subtle.deriveBits(passwordParamsBytes, pbkdf2, 256))
    const passwordHashBase64 = Bytes.toBase64(passwordHashBytes)

    return new Ok({ uuid, name, color, emoji, keyParamsBase64, valueParamsBase64, passwordParamsBase64, passwordHashBase64 })
  })
}