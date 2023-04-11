import { useUserStorage } from "@/mods/storage/user/context";
import { getSchema, NormalizerMore, StorageQueryParams, useSchema } from "@hazae41/xswr";
import { getWalletRef, Wallet } from "../data";

export function getWalletsSchema(storage: StorageQueryParams<any> | undefined) {
  if (!storage) return

  const normalizer = async (wallets: Wallet[], more: NormalizerMore) => {
    return await Promise.all(wallets.map(wallet => getWalletRef(wallet, storage, more)))
  }

  return getSchema<Wallet[]>(`wallets`, undefined, { storage, normalizer })
}

export function useWallets() {
  const storage = useUserStorage()

  return useSchema(getWalletsSchema, [storage])
}