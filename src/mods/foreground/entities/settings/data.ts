import { SettingsQuery } from "@/mods/universal/entities/settings/data"
import { useQuery } from "@hazae41/glacier"
import { useUserStorageContext } from "../../storage/user"

export function useLogs() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(SettingsQuery.Logs.create, [storage])

  return query
}

export function useChain() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(SettingsQuery.Chain.create, [storage])

  return query
}