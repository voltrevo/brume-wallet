import { EthereumChain } from "@/libs/ethereum/mods/chain"
import { WcMetadata } from "@/libs/wconn/mods/wc/wc"
import { Mutators } from "@/libs/xswr/mutators"
import { Optional } from "@hazae41/option"
import { Data, IDBStorage, IndexerMore, RawState2, States, Storage, createQuerySchema } from "@hazae41/xswr"
import { Promiseable } from "@hazae41/xswr/dist/types/libs/promises/promises"
import { Wallet } from "../wallets/data"
import { PersistentSessions, PersistentSessionsByWallet, TemporarySessions, TemporarySessionsByWallet } from "./all/data"

export type Session =
  | SessionData
  | SessionRef

export interface SessionRef {
  readonly ref: true
  readonly id: string
  readonly origin: string
}

export namespace SessionRef {

  export function from(session: Session): SessionRef {
    return { ref: true, id: session.id, origin: session.origin }
  }

}

export type SessionData =
  | ExSessionData
  | WcSessionData

export interface ExSessionData {
  readonly id: string,
  readonly type?: "ex"
  readonly origin: string
  readonly persist: boolean
  readonly chain: EthereumChain
  readonly wallets: [Wallet]
}

export interface WcSessionData {
  readonly id: string,
  readonly type: "wc"
  readonly origin: string
  readonly metadata: WcMetadata
  readonly persist: boolean
  readonly relay: string
  readonly topic: string
  readonly sessionKeyBase64: string
  readonly authKeyBase64: string
  readonly chain: EthereumChain
  readonly wallets: [Wallet]
}

export class SessionStorage implements Storage {

  constructor(
    readonly storage: IDBStorage
  ) { }

  get(cacheKey: string) {
    return this.storage.get(cacheKey)
  }

  set(cacheKey: string, value: Optional<RawState2<SessionData>>): Promiseable<void> {
    if (value?.data?.data.persist === false)
      return
    return this.storage.set(cacheKey, value)
  }

}

export namespace Session {

  export type Key = ReturnType<typeof key>

  export function key(id: string) {
    return `session/v4/${id}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(id: string, storage: IDBStorage) {
    const indexer = async (states: States<SessionData, never>, more: IndexerMore) => {
      const { current, previous = current } = states
      const { core } = more

      const previousData = previous.real?.data
      const currentData = current.real?.data

      if (previousData != null) {
        if (previousData.inner.persist) {
          const sessionByOrigin = await SessionByOrigin.schema(previousData.inner.origin, storage).make(core)
          await sessionByOrigin.delete()
        }

        const sessionsQuery = previousData.inner.persist
          ? await PersistentSessions.schema(storage).make(core)
          : await TemporarySessions.schema().make(core)

        await sessionsQuery.mutate(Mutators.mapData((d = new Data([])) => {
          return d.mapSync(p => p.filter(x => x.id !== previousData.inner.id))
        }))

        const previousWallets = new Set(previousData.inner.wallets)

        for (const wallet of previousWallets) {
          const sessionsByWalletQuery = previousData.inner.persist
            ? await PersistentSessionsByWallet.schema(wallet.uuid, storage).make(core)
            : await TemporarySessionsByWallet.schema(wallet.uuid).make(core)

          await sessionsByWalletQuery.mutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => p.filter(x => x.id !== previousData.inner.id))
          }))
        }
      }

      if (currentData != null) {
        if (currentData.inner.persist) {
          const sessionByOrigin = await SessionByOrigin.schema(currentData.inner.origin, storage).make(core)
          await sessionByOrigin.mutate(Mutators.data(SessionRef.from(currentData.inner)))
        }

        const sessionsQuery = currentData.inner.persist
          ? await PersistentSessions.schema(storage).make(core)
          : await TemporarySessions.schema().make(core)

        await sessionsQuery.mutate(Mutators.mapData((d = new Data([])) => {
          return d = d.mapSync(p => [...p, SessionRef.from(currentData.inner)])
        }))

        const currentWallets = new Set(currentData.inner.wallets)

        for (const wallet of currentWallets) {
          const sessionsByWalletQuery = currentData.inner.persist
            ? await PersistentSessionsByWallet.schema(wallet.uuid, storage).make(core)
            : await TemporarySessionsByWallet.schema(wallet.uuid).make(core)

          await sessionsByWalletQuery.mutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => [...p, SessionRef.from(currentData.inner)])
          }))
        }
      }
    }

    return createQuerySchema<Key, SessionData, never>({ key: key(id), indexer, storage: new SessionStorage(storage) })
  }

}

export namespace SessionByOrigin {

  export type Key = ReturnType<typeof key>

  export function key(origin: string) {
    return `sessionByOrigin/${origin}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(origin: string, storage: IDBStorage) {
    return createQuerySchema<Key, SessionRef, never>({ key: key(origin), storage })
  }

}