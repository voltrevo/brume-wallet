import { IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr";
import { Wallet, getWalletRef } from "../data";

export function getWallets(storage: IDBStorage) {
  const normalizer = async (wallets: Wallet[], more: NormalizerMore) =>
    await Promise.all(wallets.map(wallet => getWalletRef(wallet, storage, more)))

  return createQuerySchema<string, Wallet[], never>(`wallets`, undefined, { storage, normalizer })
}