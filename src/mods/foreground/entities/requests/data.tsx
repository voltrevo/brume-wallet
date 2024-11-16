import { Mutators } from "@/libs/glacier/mutators";
import { AppRequestRef, BgAppRequest } from "@/mods/background/service_worker/entities/requests/data";
import { Data, States, createQuery, useQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { UserStorage, useUserStorageContext } from "../../storage/user";

export namespace FgAppRequest {

  export namespace All {

    export type K = BgAppRequest.All.K
    export type D = BgAppRequest.All.D
    export type F = BgAppRequest.All.F

    export const key = BgAppRequest.All.key

    export function schema(storage: UserStorage) {
      return createQuery<K, D, F>({ key, storage })
    }

  }

  export type K = BgAppRequest.K
  export type D = BgAppRequest.D
  export type F = BgAppRequest.F

  export const key = BgAppRequest.key

  export function schema(id: Nullable<string>, storage: UserStorage) {
    if (id == null)
      return

    const indexer = async (states: States<D, F>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.getOrNull()
      const currentData = current.real?.current.ok()?.getOrNull()

      await All.schema(storage).mutateOrThrow(Mutators.mapData((d = new Data([])) => {
        if (previousData?.id === currentData?.id)
          return d
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.id !== previousData.id))
        if (currentData != null)
          d = d.mapSync(p => [...p, AppRequestRef.from(currentData)])
        return d
      }))
    }

    return createQuery<K, D, F>({ key: key(id), indexer, storage })
  }

}

export function useAppRequest(id: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgAppRequest.schema, [id, storage])

  return query
}

export function useAppRequests() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgAppRequest.All.schema, [storage])

  return query
}