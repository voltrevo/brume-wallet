import { SeedQuery } from "@/mods/universal/entities/seeds";
import { useQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { useUserStorageContext } from "../../user/mods/storage";

export function useSeed(uuid: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(SeedQuery.create, [uuid, storage])

  return query
}

export function useSeeds() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(SeedQuery.All.create, [storage])

  return query
}