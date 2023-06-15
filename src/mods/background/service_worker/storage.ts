import { Bytes } from "@hazae41/bytes"
import { Err, Ok, Result } from "@hazae41/result"
import { AesGcmCoder, AsyncCoder, AsyncEncoder, AsyncStorage, AsyncStorageSettings, HmacEncoder, IDBStorage, Identity, StoredState } from "@hazae41/xswr"
import { Pbdkf2Params } from "./entities/users/crypto"
import { UserData } from "./entities/users/data"

export async function tryCreateUserStorage(user: UserData, password: string): Promise<Result<EncryptedStorage, Error>> {
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

    return new Ok(new EncryptedStorage(storage, keySerializer, valueSerializer))
  })
}

export class PipeCoder<I, X, O> implements AsyncCoder<I, O>{

  constructor(
    readonly outer: AsyncCoder<I, X>,
    readonly inner: AsyncCoder<X, O>
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

export class EncryptedStorage implements AsyncStorage<string, string> {
  readonly async: true = true

  constructor(
    readonly storage: AsyncStorage<string, unknown>,
    readonly keySerializer: HmacEncoder,
    readonly valueSerializer: AesGcmCoder
  ) { }

  #keySerializer<D, F>(settings: AsyncStorageSettings<D, F, string, string>) {
    const { keySerializer = Identity } = settings
    return new PipeEncoder(keySerializer, this.keySerializer)
  }

  #valueSerializer<D, F>(settings: AsyncStorageSettings<D, F, string, string>) {
    const { valueSerializer = JSON } = settings
    return new PipeCoder(valueSerializer, this.valueSerializer)
  }

  async get<D, F>(key: string, settings: AsyncStorageSettings<D, F, string, string>) {
    const keySerializer = this.#keySerializer(settings)
    const valueSerializer = this.#valueSerializer(settings)

    return await this.storage.get<D, F>(key, { keySerializer, valueSerializer })
  }

  async set<D, F>(key: string, state: StoredState<D, F>, settings: AsyncStorageSettings<D, F, string, string>) {
    const keySerializer = this.#keySerializer(settings)
    const valueSerializer = this.#valueSerializer(settings)

    return await this.storage.set<D, F>(key, state, { keySerializer, valueSerializer })
  }

  async delete<D, F>(key: string, settings: AsyncStorageSettings<D, F, string, string>) {
    const keySerializer = this.#keySerializer(settings)
    const valueSerializer = this.#valueSerializer(settings)

    return await this.storage.delete<D, F>(key, { keySerializer, valueSerializer })
  }

}