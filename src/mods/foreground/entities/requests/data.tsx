import { BgAppRequest } from "@/mods/background/service_worker/entities/requests/data";
import { createQuery, useQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { useSubscribe } from "../../storage/storage";
import { UserStorage, useUserStorageContext } from "../../storage/user";

export namespace FgAppRequest {

  export namespace All {

    export type Key = BgAppRequest.All.Key
    export type Data = BgAppRequest.All.Data
    export type Fail = BgAppRequest.All.Fail

    export const key = BgAppRequest.All.key

    export function schema(storage: UserStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

  export type Key = BgAppRequest.Key
  export type Data = BgAppRequest.Data
  export type Fail = BgAppRequest.Fail

  export const key = BgAppRequest.key

  export function schema(id: Nullable<string>, storage: UserStorage) {
    if (id == null)
      return

    return createQuery<Key, Data, Fail>({ key: key(id), storage })
  }

}

export function useAppRequest(id: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgAppRequest.schema, [id, storage])
  useSubscribe(query, storage)
  return query
}