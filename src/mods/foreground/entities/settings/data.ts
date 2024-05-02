import { BgSettings } from "@/mods/background/service_worker/entities/settings/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { UserStorage, useUserStorageContext } from "../../storage/user"

export namespace FgSettings {

  export namespace Logs {

    export type Key = BgSettings.Logs.Key
    export type Data = BgSettings.Logs.Data
    export type Fail = BgSettings.Logs.Fail

    export const key = BgSettings.Logs.key

    export function schema(storage: UserStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

  export namespace Chain {

    export type Key = BgSettings.Chain.Key
    export type Data = BgSettings.Chain.Data
    export type Fail = BgSettings.Chain.Fail

    export const key = BgSettings.Chain.key

    export function schema(storage: UserStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

}

export function useLogs() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgSettings.Logs.schema, [storage])

  return query
}

export function useChain() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgSettings.Chain.schema, [storage])

  return query
}