import { EthereumChain } from "@/libs/ethereum/chain"
import { Sets } from "@/libs/sets/sets"
import { Mutators } from "@/libs/xswr/mutators"
import { Data, IDBStorage, IndexerMore, States, createQuerySchema } from "@hazae41/xswr"
import { Wallet } from "../wallets/data"
import { Sessions, SessionsByWallet } from "./all/data"

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

export interface SessionData {
  id: string,
  origin: string
  chain: EthereumChain
  wallets: [Wallet]
}

export namespace TemporarySession {

  export type Key = ReturnType<typeof key>

  export function key(id: string) {
    return `temporarySession/${id}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(id: string) {
    return createQuerySchema<Key, SessionData, never>({ key: key(id) })
  }

}

export namespace PersistentSession {

  export type Key = ReturnType<typeof key>

  export function key(id: string) {
    return `persistentSession/${id}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(id: string, storage: IDBStorage) {
    const indexer = async (states: States<SessionData, never>, more: IndexerMore) => {
      const { current, previous = current } = states
      const { core } = more

      const previousData = previous.real?.data
      const currentData = current.real?.data

      const persSessionsQuery = await Sessions.schema(storage).make(core)

      await persSessionsQuery.mutate(Mutators.mapData((d = new Data([])) => {
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.id !== previousData.inner.id))
        if (currentData != null)
          d = d.mapSync(p => [...p, SessionRef.from(currentData.inner)])
        return d
      }))

      const previousWallets = new Set(previousData?.inner.wallets.map(x => x.uuid))
      const currentWallets = new Set(currentData?.inner.wallets.map(x => x.uuid))

      const removedWallets = Sets.minus(previousWallets, currentWallets)
      const addedWallets = Sets.minus(currentWallets, previousWallets)

      for (const wallet of removedWallets) {
        const walletSessionsQuery = await SessionsByWallet.schema(wallet, storage).make(core)

        await walletSessionsQuery.mutate(Mutators.mapData((d = new Data([])) => {
          if (previousData != null)
            d = d.mapSync(p => p.filter(x => x.id !== previousData.inner.id))
          return d
        }))
      }

      for (const wallet of addedWallets) {
        const walletSessionsQuery = await SessionsByWallet.schema(wallet, storage).make(core)

        await walletSessionsQuery.mutate(Mutators.mapData((d = new Data([])) => {
          if (currentData != null)
            d = d.mapSync(p => [...p, SessionRef.from(currentData.inner)])
          return d
        }))
      }

      return
    }

    return createQuerySchema<Key, SessionData, never>({ key: key(id), storage, indexer })
  }

}