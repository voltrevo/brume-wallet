import { Mutators } from "@/libs/xswr/mutators"
import { UserStorage } from "@/mods/foreground/storage/user"
import { Data, IDBStorage, States, createQuerySchema } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { Seeds } from "./all/data"

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
  | LedgerSeedData

export type MnemonicSeedData =
  | UnauthMnemonicSeedData
  | AuthMnemonicSeedData

export interface UnauthMnemonicSeedData {
  readonly type: "mnemonic"

  readonly uuid: string
  readonly name: string

  readonly color: number
  readonly emoji: string

  readonly mnemonic: string
}

export interface AuthMnemonicSeedData {
  readonly type: "authMnemonic"

  readonly uuid: string
  readonly name: string

  readonly color: number
  readonly emoji: string

  readonly mnemonic: {
    readonly ivBase64: string,
    readonly idBase64: string
  }
}

export interface LedgerSeedData {
  readonly type: "ledger"

  readonly uuid: string
  readonly name: string

  readonly color: number
  readonly emoji: string

  /**
   * 44'/60'/0'/0/0 address in order to identify the seed
   */
  readonly address: string
}

export namespace Seed {

  export type Key = ReturnType<typeof key>

  export function key(uuid: string) {
    return `seed/${uuid}`
  }

  export namespace Background {

    export function schema(uuid: string, storage: IDBStorage) {
      const indexer = async (states: States<SeedData, never>) => {
        const { current, previous = current } = states

        const previousData = previous.real?.data
        const currentData = current.real?.data

        await Seeds.Background.schema(storage).mutate(Mutators.mapData((d = new Data([])) => {
          if (previousData != null)
            d = d.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid))
          if (currentData != null)
            d = d.mapSync(p => [...p, SeedRef.from(currentData.inner)])
          return d
        }))
      }

      return createQuerySchema<Key, SeedData, never>({ key: key(uuid), storage, indexer })
    }

  }

  export namespace Foreground {

    export function schema(uuid: Nullable<string>, storage: UserStorage) {
      if (uuid) return createQuerySchema<Key, SeedData, never>({ key: key(uuid), storage })
    }

  }

}