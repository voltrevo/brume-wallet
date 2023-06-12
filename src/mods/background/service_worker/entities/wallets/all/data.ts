import { NormalizerMore, StorageQueryParams, createQuerySchema } from "@hazae41/xswr";
import { Wallet, getWalletRef } from "../data";

export function getWallets(storage: StorageQueryParams<any>) {
  const normalizer = async (wallets: Wallet[], more: NormalizerMore) =>
    await Promise.all(wallets.map(wallet => getWalletRef(wallet, storage, more)))

  return createQuerySchema<Wallet[]>(`wallets`, undefined, { storage, normalizer })
}