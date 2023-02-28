import { storage } from "@/libs/xswr/storage";
import { getSchema, NormalizerMore, useSchema } from "@hazae41/xswr";
import { getWalletNormal, Wallet } from "../data";

export function getWalletsSchema() {
  const normalizer = async (wallets: Wallet[], more: NormalizerMore) => {
    return await Promise.all(wallets.map(wallet => getWalletNormal(wallet, more)))
  }

  return getSchema<Wallet[]>(`wallets`, undefined, { storage, normalizer })
}

export function useWallets() {
  return useSchema(getWalletsSchema, [])
}