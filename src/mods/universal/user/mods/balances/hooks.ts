import { useUserStorageContext } from "@/mods/foreground/user/mods/storage";
import { useQuery } from "@hazae41/glacier";
import { Balance } from ".";

export function useUserTotalPricedBalance() {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Priced.Total.queryOrThrow, [storage])

  return query
}