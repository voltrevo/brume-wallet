import { BgChainSettings, ChainSettings } from "@/mods/background/service_worker/entities/wallets/chains/data"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { UserStorage, useUserStorage } from "@/mods/foreground/storage/user"
import { createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"

export namespace FgChainSettings {

  export function schema(uuid: Nullable<string>, chainId: Nullable<number>, storage: UserStorage) {
    if (uuid == null)
      return undefined
    if (chainId == null)
      return undefined
    return createQuery<string, ChainSettings, never>({ key: BgChainSettings.key(uuid, chainId), storage })
  }

}

export function useChain(uuid: Nullable<string>, chainId: Nullable<number>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(FgChainSettings.schema, [uuid, chainId, storage])
  useSubscribe(query as any, storage)
  return query
}