import { UserStorage } from "@/mods/foreground/storage/user";
import { IDBStorage, createQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { WalletRef } from "../../wallets/data";

export namespace WalletsBySeed {

  export type Key = ReturnType<typeof key>

  export function key(uuid: string) {
    return `walletsBySeed/${uuid}`
  }

  export namespace Background {

    export function schema(uuid: string, storage: IDBStorage) {
      return createQuery<Key, WalletRef[], never>({ key: key(uuid), storage })
    }

  }

  export namespace Foreground {

    export function schema(uuid: Nullable<string>, storage: UserStorage) {
      if (uuid) return createQuery<Key, WalletRef[], never>({ key: key(uuid), storage })
    }

  }

}