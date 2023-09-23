import { UserStorage } from "@/mods/foreground/storage/user";
import { IDBStorage, createQuerySchema } from "@hazae41/glacier";
import { Optional } from "@hazae41/option";
import { WalletRef } from "../../wallets/data";
import { SeedRef } from "../data";

export namespace Seeds {

  export type Key = typeof key

  export const key = `seeds`

  export namespace Background {

    export function schema(storage: IDBStorage) {
      return createQuerySchema<Key, SeedRef[], never>({ key, storage })
    }

  }

  export namespace Foreground {

    export function schema(storage: UserStorage) {
      return createQuerySchema<Key, SeedRef[], never>({ key, storage })
    }

  }

}

export namespace WalletsBySeed {

  export type Key = ReturnType<typeof key>

  export function key(uuid: string) {
    return `walletsBySeed/${uuid}`
  }

  export namespace Background {

    export function schema(uuid: string, storage: IDBStorage) {
      return createQuerySchema<Key, WalletRef[], never>({ key: key(uuid), storage })
    }

  }

  export namespace Foreground {

    export function schema(uuid: Optional<string>, storage: UserStorage) {
      if (uuid) return createQuerySchema<Key, WalletRef[], never>({ key: key(uuid), storage })
    }

  }

}