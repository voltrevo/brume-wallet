import { Mutators } from "@/libs/glacier/mutators"
import { BgSession, SessionRef } from "@/mods/background/service_worker/entities/sessions/data"
import { Data, States, createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { UserStorage, useUserStorageContext } from "../../storage/user"

export namespace FgSession {

  export namespace All {

    export namespace Temporary {

      export namespace ByWallet {

        export type Key = BgSession.All.Temporary.ByWallet.Key
        export type Data = BgSession.All.Temporary.ByWallet.Data
        export type Fail = BgSession.All.Temporary.ByWallet.Fail

        export const key = BgSession.All.Temporary.ByWallet.key

        export function schema(wallet: Nullable<string>, storage: UserStorage) {
          if (wallet == null)
            return

          return createQuery<Key, Data, Fail>({ key: key(wallet), storage })
        }

      }

      export type Key = BgSession.All.Temporary.Key
      export type Data = BgSession.All.Temporary.Data
      export type Fail = BgSession.All.Temporary.Fail

      export const key = BgSession.All.Temporary.key

      export function schema(storage: UserStorage) {
        return createQuery<Key, Data, Fail>({ key, storage })
      }

    }

    export namespace Persistent {

      export namespace ByWallet {

        export type Key = BgSession.All.Persistent.ByWallet.Key
        export type Data = BgSession.All.Persistent.ByWallet.Data
        export type Fail = BgSession.All.Persistent.ByWallet.Fail

        export const key = BgSession.All.Persistent.ByWallet.key

        export function schema(wallet: Nullable<string>, storage: UserStorage) {
          if (wallet == null)
            return

          return createQuery<Key, Data, Fail>({ key: key(wallet), storage })
        }

      }

      export type Key = BgSession.All.Persistent.Key
      export type Data = BgSession.All.Persistent.Data
      export type Fail = BgSession.All.Persistent.Fail

      export const key = BgSession.All.Persistent.key

      export function schema(storage: UserStorage) {
        return createQuery<Key, Data, Fail>({ key, storage })
      }

    }

  }

  export namespace ByOrigin {

    export type Key = BgSession.ByOrigin.Key
    export type Data = BgSession.ByOrigin.Data
    export type Fail = BgSession.ByOrigin.Fail

    export const key = BgSession.ByOrigin.key

    export function schema(origin: string, storage: UserStorage) {
      return createQuery<Key, Data, Fail>({ key: key(origin), storage })
    }

  }

  export type Key = BgSession.Key
  export type Data = BgSession.Data
  export type Fail = BgSession.Fail

  export const key = BgSession.key

  export function shema(id: Nullable<string>, storage: UserStorage) {
    if (id == null)
      return

    const indexer = async (states: States<Data, Fail>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.getOrNull()
      const currentData = current.real?.current.ok()?.getOrNull()

      if (previousData != null) {
        if (previousData.persist) {
          const sessionByOrigin = ByOrigin.schema(previousData.origin, storage)
          await sessionByOrigin.delete()
        }

        const sessionsQuery = previousData.persist
          ? All.Persistent.schema(storage)
          : All.Temporary.schema(storage)

        await sessionsQuery.mutate(Mutators.mapData((d = new Data([])) => {
          return d.mapSync(p => p.filter(x => x.id !== previousData.id))
        }))

        const previousWallets = new Set(previousData.wallets)

        for (const wallet of previousWallets) {
          const sessionsByWalletQuery = previousData.persist
            ? All.Persistent.ByWallet.schema(wallet.uuid, storage)
            : All.Temporary.ByWallet.schema(wallet.uuid, storage)

          await sessionsByWalletQuery?.mutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => p.filter(x => x.id !== previousData.id))
          }))
        }
      }

      if (currentData != null) {
        if (currentData.persist) {
          const sessionByOrigin = ByOrigin.schema(currentData.origin, storage)
          await sessionByOrigin.mutate(Mutators.data<ByOrigin.Data, ByOrigin.Fail>(SessionRef.from(currentData)))
        }

        const sessionsQuery = currentData.persist
          ? All.Persistent.schema(storage)
          : All.Temporary.schema(storage)

        await sessionsQuery.mutate(Mutators.mapData((d = new Data([])) => {
          return d = d.mapSync(p => [...p, SessionRef.from(currentData)])
        }))

        const currentWallets = new Set(currentData.wallets)

        for (const wallet of currentWallets) {
          const sessionsByWalletQuery = currentData.persist
            ? All.Persistent.ByWallet.schema(wallet.uuid, storage)
            : All.Temporary.ByWallet.schema(wallet.uuid, storage)

          await sessionsByWalletQuery?.mutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => [...p, SessionRef.from(currentData)])
          }))
        }
      }
    }

    return createQuery<Key, Data, Fail>({ key: key(id), indexer, storage })
  }

}

export function useSession(id: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgSession.shema, [id, storage])

  return query
}