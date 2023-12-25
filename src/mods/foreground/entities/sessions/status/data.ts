import { Status, StatusData } from "@/mods/background/service_worker/entities/sessions/status/data";
import { useSubscribe } from "@/mods/foreground/storage/storage";
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user";
import { createQuery, useQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";

export function getStatus(id: Nullable<string>, storage: UserStorage) {
  if (id == null)
    return undefined

  return createQuery<string, StatusData, never>({ key: Status.key(id), storage })
}

export function useStatus(id: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(getStatus, [id, storage])
  useSubscribe(query, storage)
  return query
}