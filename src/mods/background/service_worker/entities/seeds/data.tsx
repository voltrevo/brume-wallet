import { UserStorage } from "@/mods/foreground/storage/user"
import { Optional } from "@hazae41/option"
import { IDBStorage, createQuerySchema } from "@hazae41/xswr"

export type Seed =
  | SeedRef
  | SeedData

export interface SeedRef {
  readonly ref: true
  readonly uuid: string
}

export namespace SeedRef {

  export function from(seed: Seed): SeedRef {
    return { ref: true, uuid: seed.uuid }
  }

}

export type SeedData =
  | MnemonicSeedData
  | AuthMnemonicSeedData

export interface MnemonicSeedData {
  readonly uuid: string
  readonly type: "mnemonic"

  readonly mnemonic: string
}

export interface AuthMnemonicSeedData {
  readonly uuid: string
  readonly type: "authMnemonic"

  readonly mnemonic: {
    readonly ivBase64: string,
    readonly idBase64: string
  }
}

export interface LedgerSeedData {
  readonly uuid: string
  readonly type: "ledger"

  readonly todo: unknown
}

export namespace Seed {

  export type Key = ReturnType<typeof key>

  export function key(uuid: string) {
    return `seed/${uuid}`
  }

  export namespace Background {

    export function schema(uuid: string, storage: IDBStorage) {
      return createQuerySchema<Key, SeedData, never>({ key: key(uuid), storage })
    }

  }

  export namespace Foreground {

    export function schema(uuid: Optional<string>, storage: UserStorage) {
      if (uuid) return createQuerySchema<Key, SeedData, never>({ key: key(uuid), storage })
    }

  }

}