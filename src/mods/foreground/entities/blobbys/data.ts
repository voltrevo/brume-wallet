import { BgBlobby } from "@/mods/background/service_worker/entities/blobbys/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { UserStorage, useUserStorageContext } from "../../storage/user"

export namespace FgBlobby {

  export type Key = BgBlobby.Key
  export type Data = BgBlobby.Data
  export type Fail = BgBlobby.Fail

  export const key = BgBlobby.key

  export function schema(id: Nullable<string>, storage: UserStorage) {
    if (id == null)
      return

    return createQuery<Key, Data, Fail>({ key: key(id), storage })
  }

}

export function useBlobby(id: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgBlobby.schema, [id, storage])

  return query
}