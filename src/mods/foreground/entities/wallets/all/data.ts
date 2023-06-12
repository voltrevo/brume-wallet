import { useUserStorage } from "@/mods/foreground/storage/user/context";
import { NormalizerMore, StorageQueryParams, createQuerySchema, useQuery } from "@hazae41/xswr";
import { Wallet, getWalletRef } from "../data";

export function getWalletsSchema(storage: StorageQueryParams<any> | undefined) {
  if (!storage) return

  const normalizer = async (wallets: Wallet[], more: NormalizerMore) => {
    return await Promise.all(wallets.map(wallet => getWalletRef(wallet, storage, more)))
  }

  return createQuerySchema<Wallet[]>(`wallets`, undefined, { storage, normalizer })
}

export function useWallets() {
  const storage = useUserStorage()

  return useQuery(getWalletsSchema, [storage])
}