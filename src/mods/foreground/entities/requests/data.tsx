import { Mutators } from "@/libs/glacier/mutators";
import { AppRequestRef, BgAppRequest } from "@/mods/background/service_worker/entities/requests/data";
import { Data, States, createQuery, useQuery } from "@hazae41/glacier";
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

    const indexer = async (states: States<Data, Fail>) => {
      const { current, previous = current } = states

      const previousData = previous.real?.data
      const currentData = current.real?.data

      await All.schema(storage).mutate(Mutators.mapData((d = new Data([])) => {
        if (previousData?.inner.id === currentData?.inner.id)
          return d
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.id !== previousData.inner.id))
        if (currentData != null)
          d = d.mapSync(p => [...p, AppRequestRef.from(currentData.inner)])
        return d
      }))
    }

    return createQuery<Key, Data, Fail>({ key: key(id), indexer, storage })
  }

}

export function useAppRequest(id: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgAppRequest.schema, [id, storage])
  useSubscribe(query, storage)
  return query
}

export function useAppRequests() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgAppRequest.All.schema, [storage])
  useSubscribe(query, storage)
  return query
}