import { BgSnap } from "@/mods/background/service_worker/entities/snaps/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { UserStorage, useUserStorageContext } from "../../storage/user"

export namespace FgSnap {

  export namespace All {

    export type Key = BgSnap.All.Key
    export type Data = BgSnap.All.Data
    export type Fail = BgSnap.All.Fail

    export const key = BgSnap.All.key

    export function schema(storage: UserStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

  export type Key = BgSnap.Key
  export type Data = BgSnap.Data
  export type Fail = BgSnap.Fail

  export const key = BgSnap.key

  export function schema(uuid: Nullable<string>, storage: UserStorage) {
    if (uuid == null)
      return

    return createQuery<Key, Data, Fail>({ key: key(uuid), storage })
  }

}

export function useSnap(uuid: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgSnap.schema, [uuid, storage])

  return query
}

export function useSnaps() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgSnap.All.schema, [storage])

  return query
}