import { Status, StatusData } from "@/mods/background/service_worker/entities/sessions/status/data";
import { useSubscribe } from "@/mods/foreground/storage/storage";
import { UserStorage, useUserStorage } from "@/mods/foreground/storage/user";
import { createQuerySchema, useQuery } from "@hazae41/glacier";
import { Optional } from "@hazae41/option";

export function getStatus(id: Optional<string>, storage: UserStorage) {
  if (id == null)
    return undefined

  return createQuerySchema<string, StatusData, never>({ key: Status.key(id), storage })
}

export function useStatus(id: Optional<string>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getStatus, [id, storage])
  useSubscribe(query as any, storage)
  return query
}