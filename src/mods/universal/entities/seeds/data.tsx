import { Mutators } from "@/libs/glacier/mutators"
import { Data, States, Storage, createQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"

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

export function getSeedEmoji(type: SeedData["type"]): string {
  if (type === "mnemonic")
    return "🖋️"
  if (type === "authMnemonic")
    return "🔏"
  if (type === "ledger")
    return "✨"
  return type satisfies never
}

export interface UnauthMnemonicSeedData {
  readonly type: "mnemonic"

  readonly uuid: string
  readonly name: string
  readonly color: number

  readonly mnemonic: string
}

export interface AuthMnemonicSeedData {
  readonly type: "authMnemonic"

  readonly uuid: string
  readonly name: string
  readonly color: number

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

  /**
   * 44'/60'/0'/0/0 address in order to identify the seed
   */
  readonly address: string
}

export namespace SeedQuery {

  export namespace All {

    export type K = string
    export type D = SeedRef[]
    export type F = never

    export const key = `seeds`

    export function create(storage: Storage) {
      return createQuery<K, D, F>({ key, storage })
    }

  }

  export type K = string
  export type D = SeedData
  export type F = never

  export function key(uuid: string): K {
    return `seed/${uuid}`
  }

  export function create(uuid: Nullable<string>, storage: Storage) {
    if (uuid == null)
      return

    const indexer = async (states: States<D, F>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.getOrNull()
      const currentData = current.real?.current.ok()?.getOrNull()

      await All.create(storage).mutate(Mutators.mapData((d = new Data([])) => {
        if (previousData?.uuid === currentData?.uuid)
          return d
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
        if (currentData != null)
          d = d.mapSync(p => [...p, SeedRef.from(currentData)])
        return d
      }))
    }

    return createQuery<K, D, F>({ key: key(uuid), storage, indexer })
  }

}