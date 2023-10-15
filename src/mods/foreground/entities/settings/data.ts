import { BgSettings } from "@/mods/background/service_worker/entities/settings/data"
import { createQuery, useQuery } from "@hazae41/glacier"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorage } from "../../storage/user"

export namespace FgSettings {

  export namespace Logs {

    export const key = BgSettings.Logs.key

    export function schema(storage: UserStorage) {
      return createQuery<string, boolean, never>({ key, storage })
    }

  }
}

export function useLogs() {
  const storage = useUserStorage().unwrap()
  const query = useQuery(FgSettings.Logs.schema, [storage])
  useSubscribe(query as any, storage)
  return query
}