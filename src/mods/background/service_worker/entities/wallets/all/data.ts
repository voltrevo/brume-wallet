import { IDBStorage, createQuery } from "@hazae41/glacier";
import { WalletRef } from "../data";

export namespace Wallets {

  export type Key = typeof key

  export const key = `wallets`

  export type Schema = ReturnType<typeof schema>

  export function schema(storage: IDBStorage) {
    return createQuery<Key, WalletRef[], never>({ key, storage })
  }

}