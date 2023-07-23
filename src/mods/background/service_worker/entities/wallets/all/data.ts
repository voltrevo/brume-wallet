import { Optional } from "@hazae41/option";
import { Fetched, IDBStorage, NormalizerMore, createQuerySchema } from "@hazae41/xswr";
import { Wallet } from "../data";

export namespace Wallets {

  export type Key = typeof key

  export const key = `wallets`

  export type Schema = ReturnType<typeof schema>

  export function schema(storage: IDBStorage) {
    const normalizer = async (fetched: Optional<Fetched<Wallet[], never>>, more: NormalizerMore) =>
      fetched?.map(async wallets => await Promise.all(wallets.map(wallet => Wallet.normalize(wallet, storage, more))))

    return createQuerySchema<Key, Wallet[], never>({ key, storage, normalizer })
  }

}