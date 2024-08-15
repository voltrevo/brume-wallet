import { Mutators } from "@/libs/glacier/mutators"
import { Circuits } from "@/libs/tor/circuits/circuits"
import { createNativeWebSocketPool, createTorPool } from "@/libs/tor/tors/tors"
import { Base64 } from "@hazae41/base64"
import { Bytes } from "@hazae41/bytes"
import { Disposer } from "@hazae41/disposer"
import { Circuit, TorClientDuplex } from "@hazae41/echalote"
import { AesGcmCoder, Data, HmacEncoder, IDBStorage, States, createQuery } from "@hazae41/glacier"
import { Mutex } from "@hazae41/mutex"
import { Pool } from "@hazae41/piscine"
import { EthBrume, WcBrume } from "../brumes/data"
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

  export function create(uuid: string): UserRef {
    return { ref: true, uuid }
  }

  export function from(user: User): UserRef {
    return create(user.uuid)
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

export interface UserSessionParams {
  readonly user: User,
  readonly storage: IDBStorage,
  readonly hasher: HmacEncoder,
  readonly crypter: AesGcmCoder
}

export class UserSession {

  readonly tors: Mutex<Pool<TorClientDuplex>>
  readonly sockets: Mutex<Pool<Disposer<WebSocket>>>
  readonly circuits: Mutex<Pool<Circuit>>

  readonly wcBrumes: Mutex<Pool<WcBrume>>
  readonly ethBrumes: Mutex<Pool<EthBrume>>

  readonly ethBrumeByUuid = new Mutex(new Map<string, EthBrume>())

  constructor(
    readonly user: User,
    readonly storage: IDBStorage,
    readonly hasher: HmacEncoder,
    readonly crypter: AesGcmCoder
  ) {
    this.sockets = new Mutex(createNativeWebSocketPool({ capacity: 1 }).get())
    this.tors = new Mutex(createTorPool(this.sockets, storage, { capacity: 1 }).get())
    this.circuits = new Mutex(Circuits.pool(this.tors, storage, { capacity: 8 }).get())

    this.wcBrumes = new Mutex(WcBrume.createPool(this.circuits, { capacity: 1 }))
    this.ethBrumes = new Mutex(EthBrume.createPool(this.circuits, { capacity: 1 }))
  }

  static create(params: UserSessionParams) {
    const { user, storage, hasher, crypter } = params
    return new UserSession(user, storage, hasher, crypter)
  }

  async getOrTakeEthBrumeOrThrow(uuid: string): Promise<EthBrume> {
    return await this.ethBrumeByUuid.lock(async ethBrumeByUuid => {
      const cached = ethBrumeByUuid.get(uuid)

      if (cached != null)
        return cached

      const fetched = await Pool.takeCryptoRandomOrThrow(this.ethBrumes).then(r => r.unwrap().inner.inner)

      ethBrumeByUuid.set(uuid, fetched)

      return fetched
    })
  }

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
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.get()
      const currentData = current.real?.current.ok()?.get()

      await All.schema(storage).mutate(Mutators.mapData((d = new Data([])) => {
        if (previousData?.uuid === currentData?.uuid)
          return d
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
        if (currentData != null)
          d = d.mapSync(p => [...p, UserRef.from(currentData)])
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