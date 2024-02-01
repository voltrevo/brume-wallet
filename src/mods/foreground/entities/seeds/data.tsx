import { Mutators } from "@/libs/glacier/mutators";
import { BgSeed, SeedRef } from "@/mods/background/service_worker/entities/seeds/data";
import { Data, States, createQuery, useQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { UserStorage, useUserStorageContext } from "../../storage/user";

export namespace FgSeed {

  export namespace All {

    export type Key = BgSeed.All.Key
    export type Data = BgSeed.All.Data
    export type Fail = BgSeed.All.Fail

    export const key = BgSeed.All.key

    export function schema(storage: UserStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

  export type Key = BgSeed.Key
  export type Data = BgSeed.Data
  export type Fail = BgSeed.Fail

  export const key = BgSeed.key

  export function schema(uuid: Nullable<string>, storage: UserStorage) {
    if (uuid == null)
      return

    const indexer = async (states: States<Data, Fail>) => {
      const { current, previous = current } = states

      const previousData = previous.real?.data
      const currentData = current.real?.data

      await All.schema(storage).mutate(Mutators.mapData((d = new Data([])) => {
        if (previousData?.inner.uuid === currentData?.inner.uuid)
          return d
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid))
        if (currentData != null)
          d = d.mapSync(p => [...p, SeedRef.from(currentData.inner)])
        return d
      }))
    }

    return createQuery<Key, Data, Fail>({ key: key(uuid), indexer, storage })
  }

}

export function useSeed(uuid: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgSeed.schema, [uuid, storage])

  return query
}

export function useSeeds() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgSeed.All.schema, [storage])

  return query
}