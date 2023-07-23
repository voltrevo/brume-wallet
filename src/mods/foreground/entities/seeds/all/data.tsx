import { Seeds } from "@/mods/background/service_worker/entities/seeds/all/data"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { useUserStorage } from "@/mods/foreground/storage/user"
import { useQuery } from "@hazae41/xswr"

export function useSeeds() {
  const storage = useUserStorage().unwrap()
  const query = useQuery(Seeds.Foreground.schema, [storage])
  useSubscribe(query as any, storage)
  return query
}