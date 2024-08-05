import { SeedQuery } from "@/mods/universal/entities/seeds/data";
import { useQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { useUserStorageContext } from "../../storage/user";

export function useSeed(uuid: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(SeedQuery.create, [uuid, storage])

  return query
}

export function useSeeds() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(SeedQuery.All.create, [storage])

  return query
}