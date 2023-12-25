import { BgUser } from "@/mods/background/service_worker/entities/users/data"
import { createQuery, useQuery } from "@hazae41/glacier"
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

    return createQuery<Key, Data, Fail>({ key: key(uuid), storage })
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