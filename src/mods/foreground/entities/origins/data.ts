import { OriginQuery } from "@/mods/universal/entities/origins"
import { useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { useUserStorageContext } from "../../storage/user"

export function useOrigin(origin: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(OriginQuery.create, [origin, storage])

  return query
}