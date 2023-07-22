import { EthereumChain } from "@/libs/ethereum/chain"
import { Sets } from "@/libs/sets/sets"
import { Mutators } from "@/libs/xswr/mutators"
import { Data, IDBStorage, IndexerMore, States, createQuerySchema } from "@hazae41/xswr"
import { Wallet } from "../wallets/data"
import { getSessions, getSessionsByWallet } from "./all/data"

export type Session =
  | SessionData
  | SessionRef

export interface SessionRef {
  readonly ref: true
  readonly id: string
  readonly origin: string
}

export interface SessionData {
  id: string,
  origin: string
  chain: EthereumChain
  wallets: [Wallet]
}

export namespace TemporarySession {

  export function get(id: string) {
    return createQuerySchema<string, SessionData, never>({ key: `temporarySession/${id}` })
  }

}

export namespace PersistentSession {

  export function get(id: string, storage: IDBStorage) {
    const indexer = async (states: States<SessionData, never>, more: IndexerMore) => {
      const { current, previous = current } = states
      const { core } = more

      const previousSessionData = previous.real?.data
      const currentSessionData = current.real?.data

      const persSessionsQuery = await getSessions(storage).make(core)

      await persSessionsQuery.mutate(Mutators.mapData((d = new Data([])) => {
        if (previousSessionData != null)
          d = d.mapSync(p => p.filter(x => x.id !== previousSessionData.inner.id))
        if (currentSessionData != null)
          d = d.mapSync(p => [...p, SessionRef.from(currentSessionData.inner)])
        return d
      }))

      const previousWallets = new Set(previousSessionData?.inner.wallets.map(x => x.uuid))
      const currentWallets = new Set(currentSessionData?.inner.wallets.map(x => x.uuid))

      const removedWallets = Sets.minus(previousWallets, currentWallets)
      const addedWallets = Sets.minus(currentWallets, previousWallets)

      for (const wallet of removedWallets) {
        const walletSessionsQuery = await getSessionsByWallet(wallet, storage).make(core)

        await walletSessionsQuery.mutate(Mutators.mapData((d = new Data([])) => {
          if (previousSessionData != null)
            d = d.mapSync(p => p.filter(x => x.id !== previousSessionData.inner.id))
          return d
        }))
      }

      for (const wallet of addedWallets) {
        const walletSessionsQuery = await getSessionsByWallet(wallet, storage).make(core)

        await walletSessionsQuery.mutate(Mutators.mapData((d = new Data([])) => {
          if (currentSessionData != null)
            d = d.mapSync(p => [...p, SessionRef.from(currentSessionData.inner)])
          return d
        }))
      }

      return
    }

    return createQuerySchema<string, SessionData, never>({ key: `persistentSession/${id}`, storage, indexer })
  }

}

export namespace SessionRef {

  export function from(session: Session): SessionRef {
    return { ref: true, id: session.id, origin: session.origin }
  }

}