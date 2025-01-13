import { SettingsQuery } from "@/mods/universal/entities/settings"
import { useQuery } from "@hazae41/glacier"
import { useUserStorageContext } from "../../user/mods/storage"

export function useChain() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(SettingsQuery.Chain.queryOrThrow, [storage])

  return query
}