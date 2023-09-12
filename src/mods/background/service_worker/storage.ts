import { Base64 } from "@hazae41/base64"
import { Bytes } from "@hazae41/bytes"
import { Err, Ok, Result } from "@hazae41/result"
import { AesGcmCoder, AsyncPipeBicoder, HmacEncoder, IDBStorage } from "@hazae41/xswr"
import { Pbdkf2Params } from "./entities/users/crypto"
import { UserData } from "./entities/users/data"

export interface UserStorage {
  storage: IDBStorage
  hasher: HmacEncoder
  crypter: AesGcmCoder
}

export async function tryCreateUserStorage(user: UserData, password: string): Promise<Result<UserStorage, Error>> {
  return await Result.unthrow(async t => {
    const pbkdf2 = await crypto.subtle.importKey("raw", Bytes.fromUtf8(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"])

    const passwordHashBase64 = user.passwordHashBase64
    using passwordHashSlice = Base64.get().tryDecodePadded(passwordHashBase64).throw(t)

    const passwordParamsBase64 = user.passwordParamsBase64
    const passwordParamsBytes = Pbdkf2Params.parse(passwordParamsBase64)

    const passwordHashLength = passwordHashSlice.bytes.length * 8

    const currentPasswordHashBytes = new Uint8Array(await crypto.subtle.deriveBits(passwordParamsBytes, pbkdf2, passwordHashLength))

    if (!Bytes.equals(currentPasswordHashBytes, passwordHashSlice.bytes))
      return new Err(new Error(`Invalid password`))

    const keyParamsBytes = Pbdkf2Params.parse(user.keyParamsBase64.algorithm)
    const valueParamsBytes = Pbdkf2Params.parse(user.valueParamsBase64.algorithm)

    const keyKey = await crypto.subtle.deriveKey(keyParamsBytes, pbkdf2, user.keyParamsBase64.derivedKeyType, false, ["sign"])
    const valueKey = await crypto.subtle.deriveKey(valueParamsBytes, pbkdf2, user.valueParamsBase64.derivedKeyType, false, ["encrypt", "decrypt"])

    const hasher = new HmacEncoder(keyKey)
    const crypter = new AesGcmCoder(valueKey)

    const keySerializer = hasher
    const valueSerializer = new AsyncPipeBicoder(JSON, crypter)

    const storage = IDBStorage.tryCreate({ name: user.uuid, keySerializer, valueSerializer }).throw(t)

    return new Ok({ storage, hasher, crypter })
  })
}
