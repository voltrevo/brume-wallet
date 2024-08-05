import { BlobbyQuery } from "@/mods/universal/entities/blobbys/data"
import { useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { useUserStorageContext } from "../../storage/user"

export function useBlobby(id: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(BlobbyQuery.create, [id, storage])

  return query
}