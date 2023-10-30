import { AppRequestData, BgAppRequest } from "@/mods/background/service_worker/entities/requests/data";
import { createQuery, useQuery } from "@hazae41/glacier";
import { useSubscribe } from "../../storage/storage";
import { UserStorage, useUserStorageContext } from "../../storage/user";

export namespace FgAppRequest {

  export function schema(id: string, storage: UserStorage) {
    return createQuery<string, AppRequestData, never>({ key: BgAppRequest.key(id), storage })
  }

}

export function useAppRequest(id: string) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgAppRequest.schema, [id, storage])
  useSubscribe(query, storage)
  return query
}