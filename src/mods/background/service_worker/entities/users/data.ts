import { Mutators } from "@/libs/glacier/mutators"
import { Base64 } from "@hazae41/base64"
import { Bytes } from "@hazae41/bytes"
import { AesGcmCoder, Data, HmacEncoder, IDBStorage, States, createQuery } from "@hazae41/glacier"
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

export namespace UserRef {

  export function from(user: User): UserRef {
    return { ref: true, uuid: user.uuid }
  }

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
  readonly user: User,
  readonly storage: IDBStorage
  readonly hasher: HmacEncoder
  readonly crypter: AesGcmCoder
}

export namespace BgUser {

  export namespace All {

    export type Key = string
    export type Data = User[]
    export type Fail = never

    export const key = `users`

    export function schema(storage: IDBStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

  export namespace Current {

    export type Key = string
    export type Data = User
    export type Fail = never

    export const key = `user`

    export function schema(storage: IDBStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

  export type Key = string
  export type Data = UserData
  export type Fail = never

  export function key(uuid: string) {
    return `user/${uuid}`
  }

  export function schema(uuid: string, storage: IDBStorage) {
    const indexer = async (states: States<Data, Fail>) => {
      const { current, previous = current } = states

      const previousData = previous.real?.data
      const currentData = current.real?.data

      await All.schema(storage).mutate(Mutators.mapData((d = new Data([])) => {
        if (previousData?.inner.uuid === currentData?.inner.uuid)
          return d
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid))
        if (currentData != null)
          d = d.mapSync(p => [...p, UserRef.from(currentData.inner)])
        return d
      }))
    }

    return createQuery<Key, Data, Fail>({ key: key(uuid), storage, indexer })
  }

  export async function createOrThrow(init: UserInit): Promise<UserData> {
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
        salt: Bytes.random(16)
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
        salt: Bytes.random(16)
      })
    }

    const passwordParamsBytes: Pbkdf2ParamsBytes = {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: 1_000_000,
      salt: Bytes.random(16)
    }

    const passwordParamsBase64 = Pbdkf2Params.stringify(passwordParamsBytes)
    const passwordHashBytes = new Uint8Array(await crypto.subtle.deriveBits(passwordParamsBytes, pbkdf2, 256))
    const passwordHashBase64 = Base64.get().encodePaddedOrThrow(passwordHashBytes)

    return { uuid, name, color, emoji, keyParamsBase64, valueParamsBase64, passwordParamsBase64, passwordHashBase64 }
  }

}