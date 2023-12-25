import { BgSeed, SeedData } from "@/mods/background/service_worker/entities/seeds/data";
import { createQuery, useQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { useSubscribe } from "../../storage/storage";
import { UserStorage, useUserStorageContext } from "../../storage/user";
import { FgWallet } from "../wallets/data";

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

export function useSeeds() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgSeed.All.schema, [storage])
  useSubscribe(query, storage)
  return query
}

export function useWalletsBySeed(uuid: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgWallet.All.BySeed.schema, [uuid, storage])
  useSubscribe(query, storage)
  return query
}