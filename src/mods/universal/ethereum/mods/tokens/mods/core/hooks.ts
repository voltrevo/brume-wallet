import { useUserStorageContext } from "@/mods/foreground/storage/user"
import { ZeroHexString } from "@hazae41/cubane"
import { useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { UserToken } from "."

export function useUserTokens() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(UserToken.All.queryOrThrow, [storage])
  return query
}

export function useUserToken(contract: Nullable<ZeroHexString>) {

}