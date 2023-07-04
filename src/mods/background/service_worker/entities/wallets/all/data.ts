import { Optional } from "@hazae41/option";
import { Fetched, IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr";
import { Wallet, getWalletRef } from "../data";

export function getWallets(storage: IDBStorage) {
  const normalizer = async (fetched: Optional<Fetched<Wallet[], never>>, more: NormalizerMore) =>
    fetched?.map(async wallets => await Promise.all(wallets.map(wallet => getWalletRef(wallet, storage, more))))

  return createQuerySchema<string, Wallet[], never>({ key: `wallets`, storage, normalizer })
}