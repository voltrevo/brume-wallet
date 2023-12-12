import { BgOrigin, OriginData } from "@/mods/background/service_worker/entities/origins/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorageContext } from "../../storage/user"

export namespace FgOrigin {

  export function schema(origin: Nullable<string>, storage: UserStorage) {
    if (origin == null)
      return undefined
    return createQuery<string, OriginData, never>({ key: BgOrigin.key(origin), storage })
  }

}

export function useOrigin(origin: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgOrigin.schema, [origin, storage])
  useSubscribe(query as any, storage)
  return query
}