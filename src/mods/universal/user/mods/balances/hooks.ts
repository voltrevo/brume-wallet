import { useUserStorageContext } from "@/mods/foreground/storage/user";
import { useQuery } from "@hazae41/glacier";
import { Balance } from ".";

export function useUserTotalPricedBalance() {
  const storage = useUserStorageContext().getOrThrow()

  const query = useQuery(Balance.Priced.Total.queryOrThrow, [storage])

  return query
}