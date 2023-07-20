import { OriginData } from "@/mods/background/service_worker/entities/origins/data"
import { Optional } from "@hazae41/option"
import { Query, createQuerySchema, useError, useFetch, useQuery } from "@hazae41/xswr"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorage } from "../../storage/user"

export function getOrigin(origin: Optional<string>, storage: UserStorage) {
  if (origin == null)
    return undefined

  return createQuerySchema<string, OriginData, never>({ key: `origins/v1/${origin}`, storage })
}

export function useOrigin(origin: Optional<string>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getOrigin, [origin, storage]) as Query<string, OriginData, any>
  useFetch(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}