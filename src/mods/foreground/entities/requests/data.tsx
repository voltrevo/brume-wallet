import { AppRequestData } from "@/mods/background/service_worker/entities/requests/data";
import { createQuerySchema, useQuery } from "@hazae41/glacier";
import { useSubscribe } from "../../storage/storage";
import { UserStorage, useUserStorage } from "../../storage/user";

export namespace AppRequest {

  export function get(id: string, storage: UserStorage) {
    return createQuerySchema<string, AppRequestData, never>({ key: `request/${id}`, storage })
  }

}

export function useAppRequest(id: string) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(AppRequest.get, [id, storage])
  useSubscribe(query, storage)
  return query
}