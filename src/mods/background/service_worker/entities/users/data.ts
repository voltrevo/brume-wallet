import { Bytes } from "@hazae41/bytes"
import { Ok, Result } from "@hazae41/result"
import { IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr"
import { AesGcmPbkdf2ParamsBase64, HmacPbkdf2ParamsBase64, Pbdkf2Params, Pbkdf2ParamsBase64, Pbkdf2ParamsBytes } from "./crypto"

export type User =
  | UserRef
  | UserData

export interface UserProps {
  readonly user: User
}

export interface UserDataProps {
  readonly user: UserData
}

export interface UserRef {
  readonly ref: true
  readonly uuid: string
}

export interface UserInit {
  readonly uuid: string,
  readonly name: string,

  readonly color: number
  readonly emoji: string

  readonly password: string
}

export interface UserData {
  readonly uuid: string,
  readonly name: string,

  readonly color: number
  readonly emoji: string

  readonly keyParamsBase64: HmacPbkdf2ParamsBase64
  readonly valueParamsBase64: AesGcmPbkdf2ParamsBase64

  readonly passwordParamsBase64: Pbkdf2ParamsBase64
  readonly passwordHashBase64: string
}

export interface UserSession {
  userData: UserData,
  userStorage: IDBStorage
}

export function getCurrentUser() {
  return createQuerySchema<string, UserSession, never>(`user`, undefined)
}

export function getUser(uuid: string, storage: IDBStorage) {
  return createQuerySchema<string, UserData, never>(`user/${uuid}`, undefined, { storage })
}

export async function getUserRef(user: User, storage: IDBStorage, more: NormalizerMore) {
  if ("ref" in user) return user

  const schema = getUser(user.uuid, storage)
  await schema?.normalize(user, more)

  return { ref: true, uuid: user.uuid } as UserRef
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