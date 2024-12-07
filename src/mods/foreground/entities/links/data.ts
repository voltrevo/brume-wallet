import { LinksQuery } from "@/mods/universal/entities/links";
import { useQuery } from "@hazae41/glacier";
import { useUserStorageContext } from "../../user/mods/storage";

export function useLinks() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(LinksQuery.create, [storage])

  return query
}