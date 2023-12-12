import { BgSnap, SnapData, SnapRef } from "@/mods/background/service_worker/entities/snaps/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorageContext } from "../../storage/user"

export namespace FgSnap {

  export namespace All {

    export function schema(storage: UserStorage) {
      return createQuery<string, SnapRef[], never>({ key: BgSnap.All.key, storage })
    }

  }

  export function schema(uuid: Nullable<string>, storage: UserStorage) {
    if (uuid == null)
      return undefined
    return createQuery<string, SnapData, never>({ key: BgSnap.key(uuid), storage })
  }

}

export function useSnap(uuid: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgSnap.schema, [uuid, storage])
  useSubscribe(query as any, storage)
  return query
}

export function useSnaps() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgSnap.All.schema, [storage])
  useSubscribe(query as any, storage)
  return query
}