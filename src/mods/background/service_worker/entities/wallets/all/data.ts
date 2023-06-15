import { NormalizerMore, createQuerySchema } from "@hazae41/xswr";
import { EncryptedStorage } from "../../../storage";
import { Wallet, getWalletRef } from "../data";

export function getWallets(storage: EncryptedStorage) {
  const normalizer = async (wallets: Wallet[], more: NormalizerMore) =>
    await Promise.all(wallets.map(wallet => getWalletRef(wallet, storage, more)))

  return createQuerySchema<string, Wallet[], never>(`wallets`, undefined, { storage: { storage }, normalizer })
}