import { BgBlobby, BlobbyData } from "@/mods/background/service_worker/entities/blobbys/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorageContext } from "../../storage/user"

export namespace FgBlobby {

  export function schema(id: Nullable<string>, storage: UserStorage) {
    if (id == null)
      return undefined
    return createQuery<string, BlobbyData, never>({ key: BgBlobby.key(id), storage })
  }

}

export function useBlobby(id: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgBlobby.schema, [id, storage])
  useSubscribe(query as any, storage)
  return query
}