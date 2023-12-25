import { BgSeed, SeedData } from "@/mods/background/service_worker/entities/seeds/data";
import { createQuery, useQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { useSubscribe } from "../../storage/storage";
import { UserStorage, useUserStorageContext } from "../../storage/user";

export namespace FgSeed {

  export namespace All {

    export function schema(storage: UserStorage) {
      return createQuery<BgSeed.All.Key, BgSeed.All.Data, BgSeed.All.Fail>({ key: BgSeed.All.key, storage })
    }

  }

  export function schema(uuid: Nullable<string>, storage: UserStorage) {
    if (uuid == null)
      return

    return createQuery<BgSeed.Key, SeedData, never>({ key: BgSeed.key(uuid), storage })
  }

}

export function useSeed(uuid: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgSeed.schema, [uuid, storage])
  useSubscribe(query, storage)
  return query
}