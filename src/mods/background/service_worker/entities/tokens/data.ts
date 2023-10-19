import { Mutators } from "@/libs/xswr/mutators"
import { ZeroHexString } from "@hazae41/cubane"
import { Data, IDBStorage, States, createQuery } from "@hazae41/glacier"
import { Ok, Panic, Result } from "@hazae41/result"

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
    throw new Panic()
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
  readonly address: ZeroHexString
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
  readonly pairs?: readonly string[]
}

export interface ContractTokenData {
  readonly uuid: string
  readonly type: "contract",
  readonly name: string
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
  readonly address: ZeroHexString
  readonly pairs?: readonly ZeroHexString[]
}

export namespace BgContractToken {

  export namespace All {

    export const key = `contractTokens`

    export function schema(storage: IDBStorage) {
      return createQuery<string, ContractTokenRef[], never>({ key, storage })
    }

  }

  export function key(chainId: number, address: string) {
    return `contractToken/${chainId}/${address}`
  }

  export function schema(chainId: number, address: string, storage: IDBStorage) {
    const indexer = async (states: States<ContractTokenData, never>) => {
      return await Result.unthrow<Result<void, Error>>(async t => {
        const { current, previous } = states

        const previousData = previous?.real?.data?.inner
        const currentData = current.real?.data?.inner

        if (previousData?.uuid === currentData?.uuid)
          return Ok.void()

        if (previousData != null)
          await All.schema(storage)?.tryMutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
          })).then(r => r.throw(t))

        if (currentData != null)
          await All.schema(storage)?.tryMutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => [...p, ContractTokenRef.from(currentData)])
          })).then(r => r.throw(t))

        return Ok.void()
      })
    }

    return createQuery<string, ContractTokenData, never>({ key: key(chainId, address), indexer, storage })
  }

}