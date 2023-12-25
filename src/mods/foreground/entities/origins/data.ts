import { BgOrigin } from "@/mods/background/service_worker/entities/origins/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorageContext } from "../../storage/user"

export namespace FgOrigin {

  export type Key = BgOrigin.Key
  export type Data = BgOrigin.Data
  export type Fail = BgOrigin.Fail

  export const key = BgOrigin.key

  export function schema(origin: Nullable<string>, storage: UserStorage) {
    if (origin == null)
      return

    return createQuery<Key, Data, Fail>({ key: key(origin), storage })
  }

}

export function useOrigin(origin: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgOrigin.schema, [origin, storage])
  useSubscribe(query, storage)
  return query
}