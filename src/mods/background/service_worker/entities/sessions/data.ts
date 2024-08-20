import { ChainData } from "@/libs/ethereum/mods/chain"
import { Mutators } from "@/libs/glacier/mutators"
import { Ed25519 } from "@hazae41/ed25519"
import { Data, IDBStorage, RawState2, States, Storage, createQuery } from "@hazae41/glacier"
import { RpcReceipt, WcMetadata } from "@hazae41/latrine"
import { Nullable } from "@hazae41/option"
import { Wallet } from "../wallets/data"

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
  readonly chain: ChainData
  readonly wallets: Wallet[]
}

export interface WcSessionData {
  readonly id: string,
  readonly type: "wc"
  readonly origin: string
  readonly persist: true
  readonly wallets: [Wallet]
  readonly metadata: WcMetadata
  readonly relay: string
  readonly topic: string
  readonly sessionKeyBase64: string
  readonly authKeyJwk: Ed25519.PrivateKeyJwk,
  readonly settlement?: RpcReceipt
}

export class SessionStorage implements Storage {

  constructor(
    readonly storage: IDBStorage
  ) { }

  getOrThrow(cacheKey: string) {
    return this.storage.getOrThrow(cacheKey)
  }

  setOrThrow(cacheKey: string, value: Nullable<RawState2<SessionData>>) {
    if (value?.data?.data.persist === false)
      return
    return this.storage.setOrThrow(cacheKey, value)
  }

}

export namespace BgSession {

  export namespace All {

    export namespace Temporary {

      export namespace ByWallet {

        export type Key = string
        export type Data = SessionRef[]
        export type Fail = never

        export function key(wallet: string) {
          return `temporarySessionsByWallet/v2/${wallet}`
        }

        export function schema(wallet: string) {
          return createQuery<Key, Data, Fail>({ key: key(wallet) })
        }

      }

      export type Key = string
      export type Data = SessionRef[]
      export type Fail = never

      export const key = `temporarySessions/v2`

      export type Schema = ReturnType<typeof schema>

      export function schema() {
        return createQuery<Key, Data, Fail>({ key })
      }

    }

    export namespace Persistent {

      export namespace ByWallet {

        export type Key = string
        export type Data = SessionRef[]
        export type Fail = never

        export function key(wallet: string) {
          return `persistentSessionsByWallet/v2/${wallet}`
        }

        export function schema(wallet: string, storage: IDBStorage) {
          return createQuery<Key, Data, Fail>({ key: key(wallet), storage })
        }

      }

      export type Key = string
      export type Data = SessionRef[]
      export type Fail = never

      export const key = `persistentSessions/v2`

      export function schema(storage: IDBStorage) {
        return createQuery<Key, Data, Fail>({ key, storage })
      }

    }

  }

  export namespace ByOrigin {

    export type Key = string
    export type Data = Session
    export type Fail = never

    export function key(origin: string) {
      return `sessionByOrigin/${origin}`
    }

    export function schema(origin: string, storage: IDBStorage) {
      return createQuery<Key, Data, Fail>({ key: key(origin), storage })
    }

  }

  export type Key = string
  export type Data = SessionData
  export type Fail = never

  export function key(id: string) {
    return `session/v4/${id}`
  }

  export function schema(id: string, storage: IDBStorage) {
    const indexer = async (states: States<Data, Fail>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.get()
      const currentData = current.real?.current.ok()?.get()

      if (previousData?.id === currentData?.id)
        return

      if (previousData != null) {
        if (previousData.persist) {
          const sessionByOrigin = ByOrigin.schema(previousData.origin, storage)
          await sessionByOrigin.delete()
        }

        const sessionsQuery = previousData.persist
          ? All.Persistent.schema(storage)
          : All.Temporary.schema()

        await sessionsQuery.mutate(Mutators.mapData((d = new Data([])) => {
          return d.mapSync(p => p.filter(x => x.id !== previousData.id))
        }))

        const previousWallets = new Set(previousData.wallets)

        for (const wallet of previousWallets) {
          const sessionsByWalletQuery = previousData.persist
            ? All.Persistent.ByWallet.schema(wallet.uuid, storage)
            : All.Temporary.ByWallet.schema(wallet.uuid)

          await sessionsByWalletQuery.mutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => p.filter(x => x.id !== previousData.id))
          }))
        }
      }

      if (currentData != null) {
        if (currentData.persist) {
          const sessionByOrigin = ByOrigin.schema(currentData.origin, storage)
          await sessionByOrigin.mutate(Mutators.data<Session, never>(SessionRef.from(currentData)))
        }

        const sessionsQuery = currentData.persist
          ? All.Persistent.schema(storage)
          : All.Temporary.schema()

        await sessionsQuery.mutate(Mutators.mapData((d = new Data([])) => {
          return d = d.mapSync(p => [...p, SessionRef.from(currentData)])
        }))

        const currentWallets = new Set(currentData.wallets)

        for (const wallet of currentWallets) {
          const sessionsByWalletQuery = currentData.persist
            ? All.Persistent.ByWallet.schema(wallet.uuid, storage)
            : All.Temporary.ByWallet.schema(wallet.uuid)

          await sessionsByWalletQuery.mutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => [...p, SessionRef.from(currentData)])
          }))
        }
      }
    }

    return createQuery<Key, Data, Fail>({ key: key(id), indexer, storage: new SessionStorage(storage) })
  }

}