import { LinksQuery } from "@/mods/universal/entities/links/data";
import { useQuery } from "@hazae41/glacier";
import { useUserStorageContext } from "../../storage/user";

export function useLinks() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(LinksQuery.create, [storage])

  return query
}