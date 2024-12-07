import { Mutators } from "@/libs/glacier/mutators"
import { BgSession, SessionRef } from "@/mods/background/service_worker/entities/sessions/data"
import { Data, States, createQuery, useQuery } from "@hazae41/glacier"
import { Nullable, Some } from "@hazae41/option"
import { UserStorage, useUserStorageContext } from "../../user/mods/storage"

export namespace FgSession {

  export namespace All {

    export namespace Temporary {

      export namespace ByWallet {

        export type K = BgSession.All.Temporary.ByWallet.K
        export type D = BgSession.All.Temporary.ByWallet.D
        export type F = BgSession.All.Temporary.ByWallet.F

        export const key = BgSession.All.Temporary.ByWallet.key

        export function schema(wallet: Nullable<string>, storage: UserStorage) {
          if (wallet == null)
            return

          return createQuery<K, D, F>({ key: key(wallet), storage })
        }

      }

      export type K = BgSession.All.Temporary.K
      export type D = BgSession.All.Temporary.D
      export type F = BgSession.All.Temporary.F

      export const key = BgSession.All.Temporary.key

      export function schema(storage: UserStorage) {
        return createQuery<K, D, F>({ key, storage })
      }

    }

    export namespace Persistent {

      export namespace ByWallet {

        export type K = BgSession.All.Persistent.ByWallet.K
        export type D = BgSession.All.Persistent.ByWallet.D
        export type F = BgSession.All.Persistent.ByWallet.F

        export const key = BgSession.All.Persistent.ByWallet.key

        export function schema(wallet: Nullable<string>, storage: UserStorage) {
          if (wallet == null)
            return

          return createQuery<K, D, F>({ key: key(wallet), storage })
        }

      }

      export type K = BgSession.All.Persistent.K
      export type D = BgSession.All.Persistent.D
      export type F = BgSession.All.Persistent.F

      export const key = BgSession.All.Persistent.key

      export function schema(storage: UserStorage) {
        return createQuery<K, D, F>({ key, storage })
      }

    }

  }

  export namespace ByOrigin {

    export type K = BgSession.ByOrigin.K
    export type D = BgSession.ByOrigin.D
    export type F = BgSession.ByOrigin.F

    export const key = BgSession.ByOrigin.key

    export function schema(origin: string, storage: UserStorage) {
      return createQuery<K, D, F>({ key: key(origin), storage })
    }

  }

  export type K = BgSession.K
  export type D = BgSession.D
  export type F = BgSession.F

  export const key = BgSession.key

  export function shema(id: Nullable<string>, storage: UserStorage) {
    if (id == null)
      return

    const indexer = async (states: States<D, F>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.getOrNull()
      const currentData = current.real?.current.ok()?.getOrNull()

      if (previousData != null) {
        if (previousData.persist) {
          const sessionByOrigin = ByOrigin.schema(previousData.origin, storage)
          await sessionByOrigin.deleteOrThrow()
        }

        const sessionsQuery = previousData.persist
          ? All.Persistent.schema(storage)
          : All.Temporary.schema(storage)

        await sessionsQuery.mutateOrThrow(Mutators.mapData((d = new Data([])) => {
          return d.mapSync(p => p.filter(x => x.id !== previousData.id))
        }))

        const previousWallets = new Set(previousData.wallets)

        for (const wallet of previousWallets) {
          const sessionsByWalletQuery = previousData.persist
            ? All.Persistent.ByWallet.schema(wallet.uuid, storage)
            : All.Temporary.ByWallet.schema(wallet.uuid, storage)

          await sessionsByWalletQuery?.mutateOrThrow(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => p.filter(x => x.id !== previousData.id))
          }))
        }
      }

      if (currentData != null) {
        if (currentData.persist) {
          const sessionByOrigin = ByOrigin.schema(currentData.origin, storage)
          await sessionByOrigin.mutateOrThrow(() => new Some(new Data(SessionRef.from(currentData))))
        }

        const sessionsQuery = currentData.persist
          ? All.Persistent.schema(storage)
          : All.Temporary.schema(storage)

        await sessionsQuery.mutateOrThrow(Mutators.mapData((d = new Data([])) => {
          return d = d.mapSync(p => [...p, SessionRef.from(currentData)])
        }))

        const currentWallets = new Set(currentData.wallets)

        for (const wallet of currentWallets) {
          const sessionsByWalletQuery = currentData.persist
            ? All.Persistent.ByWallet.schema(wallet.uuid, storage)
            : All.Temporary.ByWallet.schema(wallet.uuid, storage)

          await sessionsByWalletQuery?.mutateOrThrow(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => [...p, SessionRef.from(currentData)])
          }))
        }
      }
    }

    return createQuery<K, D, F>({ key: key(id), indexer, storage })
  }

}

export function useSession(id: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgSession.shema, [id, storage])

  return query
}