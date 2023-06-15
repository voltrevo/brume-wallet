import { Bytes } from "@hazae41/bytes"
import { Err, Result } from "@hazae41/result"
import { AesGcmCoder, AsyncBicoder, AsyncEncoder, Bicoder, HmacEncoder, IDBStorage, SyncBicoder } from "@hazae41/xswr"
import { Pbdkf2Params } from "./entities/users/crypto"
import { UserData } from "./entities/users/data"

export async function tryCreateUserStorage(user: UserData, password: string): Promise<Result<IDBStorage, Error>> {
  const pbkdf2 = await crypto.subtle.importKey("raw", Bytes.fromUtf8(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"])

  const passwordHashBase64 = user.passwordHashBase64
  const passwordParamsBase64 = user.passwordParamsBase64
  const passwordParamsBytes = Pbdkf2Params.parse(passwordParamsBase64)
  const passwordHashLength = Bytes.fromBase64(passwordHashBase64).length * 8

  const currentPasswordHashBytes = new Uint8Array(await crypto.subtle.deriveBits(passwordParamsBytes, pbkdf2, passwordHashLength))
  const currentPasswordHashBase64 = Bytes.toBase64(currentPasswordHashBytes)

  if (currentPasswordHashBase64 !== passwordHashBase64)
    return new Err(new Error(`Invalid password`))

  const keyParamsBytes = Pbdkf2Params.parse(user.keyParamsBase64.algorithm)
  const valueParamsBytes = Pbdkf2Params.parse(user.valueParamsBase64.algorithm)

  const keyKey = await crypto.subtle.deriveKey(keyParamsBytes, pbkdf2, user.keyParamsBase64.derivedKeyType, false, ["sign"])
  const valueKey = await crypto.subtle.deriveKey(valueParamsBytes, pbkdf2, user.valueParamsBase64.derivedKeyType, false, ["encrypt", "decrypt"])

  const keySerializer = new HmacEncoder(keyKey)

  const innerValueSerializer: AsyncBicoder<any, any> = new AesGcmCoder(valueKey)
  const outerValueSerializer: SyncBicoder<any, any> = JSON

  const valueSerializer = new PipeBicoder(outerValueSerializer, innerValueSerializer)

  return IDBStorage.tryCreate({ name: user.uuid, keySerializer, valueSerializer })
}

export class PipeBicoder<I, X, O> implements AsyncBicoder<I, O> {

  constructor(
    readonly outer: Bicoder<I, X>,
    readonly inner: Bicoder<X, O>
  ) { }

  async stringify(input: I): Promise<O> {
    return await this.inner.stringify(await this.outer.stringify(input))
  }

  async parse(output: O): Promise<I> {
    return await this.outer.parse(await this.inner.parse(output))
  }

}

export class PipeEncoder<I, X, O> implements AsyncEncoder<I, O>{

  constructor(
    readonly outer: AsyncEncoder<I, X>,
    readonly inner: AsyncEncoder<X, O>
  ) { }

  async stringify(input: I): Promise<O> {
    return await this.inner.stringify(await this.outer.stringify(input))
  }

}