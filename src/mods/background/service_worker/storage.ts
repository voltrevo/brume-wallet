import { requestOrThrow } from "@/libs/indexeddb"
import { Base64 } from "@hazae41/base64"
import { Bytes } from "@hazae41/bytes"
import { AesGcmCoder, AsyncJson, AsyncPipeBicoder, Data, HmacEncoder, QueryStorage, RawState, SeracQueryStorage } from "@hazae41/glacier"
import { None, Some } from "@hazae41/option"
import { Pbdkf2Params } from "./entities/users/crypto"
import { UserData } from "./entities/users/data"
import { BgWallet } from "./entities/wallets/data"

export interface UserStorageResult {
  readonly storage: QueryStorage
  readonly hasher: HmacEncoder
  readonly crypter: AesGcmCoder
}

export async function createUserStorageOrThrow(user: UserData, password: string): Promise<UserStorageResult> {
  const pbkdf2 = await crypto.subtle.importKey("raw", Bytes.fromUtf8(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"])

  const passwordHashBase64 = user.passwordHashBase64
  using passwordHashSlice = Base64.get().getOrThrow().decodePaddedOrThrow(passwordHashBase64)

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

  const upgrade: { event?: IDBVersionChangeEvent } = {}

  function upgrader(database: IDBDatabase, event: IDBVersionChangeEvent) {
    if (event.oldVersion === 0)
      return

    const request = event.target as IDBOpenDBRequest
    const transaction = request.transaction

    if (transaction == null)
      return

    upgrade.event = event

    if (event.oldVersion < 3)
      transaction.objectStore("keyval").createIndex("expiration", "expiration")

    return
  }

  async function collector(storage: SeracQueryStorage, storageKey: IDBValidKey) {
    const raw = await storage.getStoredOrThrow(storageKey)

    if (raw?.version !== 3) {
      await storage.database.deleteOrThrow(storageKey)
      return
    }

    if (typeof raw.key !== "string") {
      await storage.database.deleteOrThrow(storageKey)
      return
    }

    if (raw.key.startsWith("wallet/")) {
      const [, uuid] = raw.key.split("/")

      /**
       * Safely delete the wallet
       */
      await BgWallet.schema(uuid, storage).delete()

      return
    }

    await storage.database.deleteOrThrow(storageKey)
    return
  }

  const storage = await SeracQueryStorage.openAndCollectOrThrow({
    name: user.uuid,
    version: 3,
    encoders: {
      key: keySerializer,
      value: valueSerializer
    },
    upgrader,
    collector
  })

  if (upgrade.event != null && upgrade.event.oldVersion < 3) {
    const index = await storage.encoders.key.encodeOrThrow("__keys")

    const keyval = storage.database.database.transaction("keyval").objectStore("keyval")
    const keys = await requestOrThrow(keyval.getAllKeys())

    for (const storageKey of keys) {
      if (storageKey === index)
        continue

      const storageValue = await requestOrThrow(storage.database.database.transaction("keyval").objectStore("keyval").get(storageKey))
      const storageState = await storage.encoders.value.decodeOrThrow(storageValue)
      await storage.database.setOrThrow(storageKey, storageValue, storageState?.expiration)
    }

    await storage.setStoredOrThrow(index, undefined)
    console.log("Sucessfully migrated to Serac")
  }

  if (upgrade.event != null && upgrade.event.oldVersion < 2) {
    const walletsState = await BgWallet.All.schema(storage).state
    const [walletsData = []] = [walletsState.data?.get()]

    for (const walletRef of walletsData) {
      const walletState = await BgWallet.schema(walletRef.uuid, storage).state
      const walletData = walletState.data?.get()

      if (walletData == null)
        continue

      await BgWallet.All.ByAddress.schema(walletData.address, storage).mutate(s => {
        const current = s.real?.current

        if (current == null)
          return new Some(new Data([walletRef]))
        if (current.isErr())
          return new None()

        return new Some(current.mapSync(d => [...d, walletRef]))
      })
    }
  }

  return { storage, hasher, crypter }
}
