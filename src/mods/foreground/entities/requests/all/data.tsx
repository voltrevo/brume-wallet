import { BgAppRequests } from "@/mods/background/service_worker/entities/requests/all/data";
import { AppRequest } from "@/mods/background/service_worker/entities/requests/data";
import { useSubscribe } from "@/mods/foreground/storage/storage";
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user";
import { createQuery, useQuery } from "@hazae41/glacier";

export namespace FgAppRequests {

  export function schema(storage: UserStorage) {
    return createQuery<string, AppRequest[], never>({ key: BgAppRequests.key, storage })
  }

}

export function useAppRequests() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgAppRequests.schema, [storage])
  useSubscribe(query, storage)
  return query
}