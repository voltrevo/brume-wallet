import { useStorage } from "@/mods/storage/context";
import { getSchema, NormalizerMore, StorageQueryParams, useSchema } from "@hazae41/xswr";
import { getWalletNormal, Wallet } from "../data";

export function getWalletsSchema(storage: StorageQueryParams<any> | undefined) {
  if (!storage) return

  const normalizer = async (wallets: Wallet[], more: NormalizerMore) => {
    return await Promise.all(wallets.map(wallet => getWalletNormal(wallet, storage, more)))
  }

  return getSchema<Wallet[]>(`wallets`, undefined, { storage, normalizer })
}

export function useWallets() {
  const serializer = useStorage()

  return useSchema(getWalletsSchema, [serializer])
}