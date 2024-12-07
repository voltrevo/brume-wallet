import { BgSnap } from "@/mods/background/service_worker/entities/snaps/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { UserStorage, useUserStorageContext } from "../../user/mods/storage"

export namespace FgSnap {

  export namespace All {

    export type K = BgSnap.All.K
    export type D = BgSnap.All.D
    export type F = BgSnap.All.F

    export const key = BgSnap.All.key

    export function schema(storage: UserStorage) {
      return createQuery<K, D, F>({ key, storage })
    }

  }

  export type K = BgSnap.K
  export type D = BgSnap.D
  export type F = BgSnap.F

  export const key = BgSnap.key

  export function schema(uuid: Nullable<string>, storage: UserStorage) {
    if (uuid == null)
      return

    return createQuery<K, D, F>({ key: key(uuid), storage })
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