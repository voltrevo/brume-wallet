import { OriginData } from "@/mods/background/service_worker/entities/origins/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorage } from "../../storage/user"

export function getOrigin(origin: Nullable<string>, storage: UserStorage) {
  if (origin == null)
    return undefined

  return createQuery<string, OriginData, never>({ key: `origins/${origin}`, storage })
}

export function useOrigin(origin: Nullable<string>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getOrigin, [origin, storage])
  useSubscribe(query as any, storage)
  return query
}