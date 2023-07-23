import { IDBStorage, createQuerySchema } from "@hazae41/xswr";
import { WalletRef } from "../data";

export namespace Wallets {

  export type Key = typeof key

  export const key = `wallets`

  export type Schema = ReturnType<typeof schema>

  export function schema(storage: IDBStorage) {
    return createQuerySchema<Key, WalletRef[], never>({ key, storage })
  }

}