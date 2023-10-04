import { Blobby, BlobbyData } from "@/mods/background/service_worker/entities/blobbys/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorage } from "../../storage/user"

export function getBlobby(id: Nullable<string>, storage: UserStorage) {
  if (id == null)
    return undefined
  return createQuery<string, BlobbyData, never>({ key: Blobby.key(id), storage })
}

export function useBlobby(id: Nullable<string>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getBlobby, [id, storage])
  useSubscribe(query as any, storage)
  return query
}