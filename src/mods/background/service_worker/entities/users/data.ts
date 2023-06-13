import { Bytes } from "@hazae41/bytes"
import { Err, Ok, Result } from "@hazae41/result"
import { AesGcmCoder, HmacEncoder, IDBStorage, NormalizerMore, StorageQuerySettings, createQuerySchema } from "@hazae41/xswr"
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

export type UserStorage =
  StorageQuerySettings<any, never>

export interface UserSession {
  userData: UserData,
  userStorage: UserStorage
}

export function getUser(uuid: string, storage: StorageQuerySettings<any, never>) {
  return createQuerySchema<string, UserData, never>(`user/${uuid}`, undefined, { storage })
}

export async function getUserRef(wallet: User, storage: StorageQuerySettings<any, never>, more: NormalizerMore) {
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

export async function tryCreateUserStorage(user: UserData, password: string): Promise<Result<StorageQuerySettings<any, never>, Error>> {
  return await Result.unthrow(async t => {
    const pbkdf2 = await crypto.subtle.importKey("raw", Bytes.fromUtf8(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"])

    const passwordHashBase64 = user.passwordHashBase64
    const passwordParamsBase64 = user.passwordParamsBase64
    const passwordParamsBytes = Pbdkf2Params.parse(passwordParamsBase64)
    const passwordHashLength = Bytes.fromBase64(passwordHashBase64).length * 8

    const currentPasswordHashBytes = new Uint8Array(await crypto.subtle.deriveBits(passwordParamsBytes, pbkdf2, passwordHashLength))
    const currentPasswordHashBase64 = Bytes.toBase64(currentPasswordHashBytes)

    if (currentPasswordHashBase64 !== passwordHashBase64)
      return new Err(new Error(`Invalid password`))

    const storage = IDBStorage.tryCreate(user.uuid).throw(t)

    const keyParamsBytes = Pbdkf2Params.parse(user.keyParamsBase64.algorithm)
    const valueParamsBytes = Pbdkf2Params.parse(user.valueParamsBase64.algorithm)

    const keyKey = await crypto.subtle.deriveKey(keyParamsBytes, pbkdf2, user.keyParamsBase64.derivedKeyType, false, ["sign"])
    const valueKey = await crypto.subtle.deriveKey(valueParamsBytes, pbkdf2, user.valueParamsBase64.derivedKeyType, false, ["encrypt", "decrypt"])

    const keySerializer = new HmacEncoder(keyKey)
    const valueSerializer = new AesGcmCoder(valueKey)

    return new Ok({ storage, keySerializer, valueSerializer })
  })
}