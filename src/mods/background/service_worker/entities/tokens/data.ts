import { Mutators } from "@/libs/glacier/mutators"
import { ZeroHexString } from "@hazae41/cubane"
import { createQuery, Data, QueryStorage, States } from "@hazae41/glacier"

export type Token =
  | TokenData
  | TokenRef

export type NativeToken =
  | NativeTokenData
  | NativeTokenRef

export type ContractToken =
  | ContractTokenData
  | ContractTokenRef

export type TokenRef =
  | NativeTokenRef
  | ContractTokenRef

export namespace TokenRef {
  export function from(token: TokenData) {
    if (token.type === "native")
      return NativeTokenRef.from(token)
    if (token.type === "contract")
      return ContractTokenRef.from(token)
    return token satisfies never
  }
}

export interface NativeTokenRef {
  readonly ref: true
  readonly uuid: string
  readonly type: "native"
  readonly chainId: number
}

export namespace NativeTokenRef {
  export function from(token: NativeTokenData): NativeTokenRef {
    const { uuid, type, chainId } = token
    return { ref: true, uuid, type, chainId }
  }
}

export interface ContractTokenRef {
  readonly ref: true
  readonly uuid: string
  readonly type: "contract"
  readonly chainId: number
  readonly address: ZeroHexString.Unsafe
}

export namespace ContractTokenRef {
  export function from(token: ContractTokenData): ContractTokenRef {
    const { uuid, type, chainId, address } = token
    return { ref: true, uuid, type, chainId, address }
  }
}

export type TokenData =
  | NativeTokenData
  | ContractTokenData

export interface NativeTokenData {
  readonly uuid: string
  readonly type: "native"
  readonly name: string
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
}

export interface ContractTokenData {
  readonly uuid: string
  readonly type: "contract",
  readonly name: string
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
  readonly address: ZeroHexString
}

export namespace BgToken {

  export namespace Contract {

    export namespace All {

      export type K = string
      export type D = ContractToken[]
      export type F = never

      export const key = `contractTokens`

      export function schema(storage: QueryStorage) {
        return createQuery<string, ContractTokenRef[], never>({ key, storage })
      }

    }

    export type K = string
    export type D = ContractTokenData
    export type F = never

    export function key(chainId: number, address: string) {
      return `contractToken/${chainId}/${address}`
    }

    export function schema(chainId: number, address: string, storage: QueryStorage) {
      const indexer = async (states: States<D, F>) => {
        const { current, previous } = states

        const previousData = previous?.real?.current.ok()?.getOrNull()
        const currentData = current.real?.current.ok()?.getOrNull()

        if (previousData?.uuid === currentData?.uuid)
          return

        if (previousData != null) {
          await All.schema(storage)?.mutateOrThrow(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
          }))
        }

        if (currentData != null) {
          await All.schema(storage)?.mutateOrThrow(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => [...p, ContractTokenRef.from(currentData)])
          }))
        }
      }

      return createQuery<K, D, F>({
        key: key(chainId, address),
        indexer,
        storage
      })
    }

  }

}