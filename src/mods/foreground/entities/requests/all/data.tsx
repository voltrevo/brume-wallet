import { AppRequest } from "@/mods/background/service_worker/entities/requests/data";
import { useSubscribe } from "@/mods/foreground/storage/storage";
import { UserStorage, useUserStorage } from "@/mods/foreground/storage/user";
import { createQuery, useQuery } from "@hazae41/glacier";

export namespace AppRequests {

  export function get(storage: UserStorage) {
    return createQuery<string, AppRequest[], never>({ key: `requests`, storage })
  }

}

export function useAppRequests() {
  const storage = useUserStorage().unwrap()
  const query = useQuery(AppRequests.get, [storage])
  useSubscribe(query, storage)
  return query
}