import { Base64 } from "@hazae41/base64"
import { Bytes } from "@hazae41/bytes"
import { AesGcmCoder, AsyncJson, AsyncPipeBicoder, HmacEncoder, IDBStorage, RawState } from "@hazae41/glacier"
import { Pbdkf2Params } from "./entities/users/crypto"
import { UserData } from "./entities/users/data"

export interface UserStorageResult {
  readonly storage: IDBStorage
  readonly hasher: HmacEncoder
  readonly crypter: AesGcmCoder
}

export async function createUserStorageOrThrow(user: UserData, password: string): Promise<UserStorageResult> {
  const pbkdf2 = await crypto.subtle.importKey("raw", Bytes.fromUtf8(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"])

  const passwordHashBase64 = user.passwordHashBase64
  using passwordHashSlice = Base64.get().decodePaddedOrThrow(passwordHashBase64)

  const passwordParamsBase64 = user.passwordParamsBase64
  const passwordParamsBytes = Pbdkf2Params.parse(passwordParamsBase64)

  const passwordHashLength = passwordHashSlice.bytes.length * 8

  const currentPasswordHashBytes = new Uint8Array(await crypto.subtle.deriveBits(passwordParamsBytes, pbkdf2, passwordHashLength))

  if (!Bytes.equals(currentPasswordHashBytes, passwordHashSlice.bytes))
    throw new Error(`Invalid password`)

  const keyParamsBytes = Pbdkf2Params.parse(user.keyParamsBase64.algorithm)
  const valueParamsBytes = Pbdkf2Params.parse(user.valueParamsBase64.algorithm)

  const keyKey = await crypto.subtle.deriveKey(keyParamsBytes, pbkdf2, user.keyParamsBase64.derivedKeyType, false, ["sign"])
  const valueKey = await crypto.subtle.deriveKey(valueParamsBytes, pbkdf2, user.valueParamsBase64.derivedKeyType, false, ["encrypt", "decrypt"])

  const hasher = new HmacEncoder(keyKey)
  const crypter = new AesGcmCoder(valueKey)

  const keySerializer = hasher
  const valueSerializer = new AsyncPipeBicoder<RawState, string, string>(AsyncJson, crypter)

  const storage = IDBStorage.createOrThrow({ name: user.uuid, keySerializer, valueSerializer })

  return { storage, hasher, crypter }
}
