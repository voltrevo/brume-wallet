import { Mutators } from "@/libs/glacier/mutators"
import { BgUser, UserRef } from "@/mods/background/service_worker/entities/users/data"
import { Data, QueryStorage, States, createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { useGlobalStorageContext } from "../../global/mods/storage"

export namespace FgUser {

  export namespace All {

    export type K = BgUser.All.K
    export type D = BgUser.All.D
    export type F = BgUser.All.F

    export const key = BgUser.All.key

    export function schema(storage: QueryStorage) {
      return createQuery<K, D, F>({ key, storage })
    }

  }

  export namespace Current {

    export type K = BgUser.Current.K
    export type D = BgUser.Current.D
    export type F = BgUser.Current.F

    export const key = BgUser.Current.key

    export function schema(storage: QueryStorage) {
      const getOrThrow = (cacheKey: string) => storage.getOrThrow(cacheKey)
      const setOrThrow = () => { }

      return createQuery<K, D, F>({ key, storage: { getOrThrow, setOrThrow } })
    }

  }

  export type K = BgUser.K
  export type D = BgUser.D
  export type F = BgUser.F

  export const key = BgUser.key

  export function schema(uuid: Nullable<string>, storage: QueryStorage) {
    if (uuid == null)
      return

    const indexer = async (states: States<D, F>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.getOrNull()
      const currentData = current.real?.current.ok()?.getOrNull()

      await All.schema(storage).mutateOrThrow(Mutators.mapData((d = new Data([])) => {
        if (previousData?.uuid === currentData?.uuid)
          return d
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
        if (currentData != null)
          d = d.mapSync(p => [...p, UserRef.from(currentData)])
        return d
      }))
    }

    return createQuery<K, D, F>({ key: key(uuid), indexer, storage })
  }

}

export function useUsers() {
  const storage = useGlobalStorageContext().getOrThrow()
  const query = useQuery(FgUser.All.schema, [storage])

  return query
}

export function useUser(uuid: Nullable<string>) {
  const storage = useGlobalStorageContext().getOrThrow()
  const query = useQuery(FgUser.schema, [uuid, storage])

  return query
}

export function useCurrentUser() {
  const storage = useGlobalStorageContext().getOrThrow()
  const query = useQuery(FgUser.Current.schema, [storage])

  return query
}