import { Mutators } from "@/libs/glacier/mutators"
import { BgUser, UserRef } from "@/mods/background/service_worker/entities/users/data"
import { Data, States, createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { GlobalStorage, useGlobalStorageContext } from "../../storage/global"
import { useSubscribe } from "../../storage/storage"

export namespace FgUser {

  export namespace All {

    export type Key = BgUser.All.Key
    export type Data = BgUser.All.Data
    export type Fail = BgUser.All.Fail

    export const key = BgUser.All.key

    export function schema(storage: GlobalStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

  export namespace Current {

    export type Key = BgUser.Current.Key
    export type Data = BgUser.Current.Data
    export type Fail = BgUser.Current.Fail

    export const key = BgUser.Current.key

    export function schema(storage: GlobalStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

  export type Key = BgUser.Key
  export type Data = BgUser.Data
  export type Fail = BgUser.Fail

  export const key = BgUser.key

  export function schema(uuid: Nullable<string>, storage: GlobalStorage) {
    if (uuid == null)
      return

    const indexer = async (states: States<Data, Fail>) => {
      const { current, previous = current } = states

      const previousData = previous.real?.data
      const currentData = current.real?.data

      await All.schema(storage).mutate(Mutators.mapData((d = new Data([])) => {
        if (previousData?.inner.uuid === currentData?.inner.uuid)
          return d
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid))
        if (currentData != null)
          d = d.mapSync(p => [...p, UserRef.from(currentData.inner)])
        return d
      }))
    }

    return createQuery<Key, Data, Fail>({ key: key(uuid), indexer, storage })
  }

}

export function useUsers() {
  const storage = useGlobalStorageContext().unwrap()
  const query = useQuery(FgUser.All.schema, [storage])
  useSubscribe(query, storage)
  return query
}

export function useUser(uuid: Nullable<string>) {
  const storage = useGlobalStorageContext().unwrap()
  const query = useQuery(FgUser.schema, [uuid, storage])
  useSubscribe(query, storage)
  return query
}

export function useCurrentUser() {
  const storage = useGlobalStorageContext().unwrap()
  const query = useQuery(FgUser.Current.schema, [storage])
  useSubscribe(query, storage)
  return query
}