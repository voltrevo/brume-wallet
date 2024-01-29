import { Mutators } from "@/libs/glacier/mutators"
import { ZeroHexString } from "@hazae41/cubane"
import { Data, IDBStorage, States, createQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { SeedRef } from "../seeds/data"

export type Wallet =
  | WalletRef
  | WalletData

export interface WalletProps {
  readonly wallet: Wallet
}

export interface WalletDataProps {
  readonly wallet: WalletData
}

export interface WalletRef {
  readonly ref: true
  readonly uuid: string
}

export namespace WalletRef {

  export function create(uuid: string): WalletRef {
    return { ref: true, uuid }
  }

  export function from(wallet: Wallet): WalletRef {
    return create(wallet.uuid)
  }

}

export type WalletData =
  | EthereumWalletData

export type EthereumWalletData =
  | EthereumReadonlyWalletData
  | EthereumSignableWalletData

export type EthereumSignableWalletData =
  | EthereumPrivateKeyWalletData
  | EthereumSeededWalletData
  | EthereumTrezorWalletData

export type EthereumPrivateKeyWalletData =
  | EthereumUnauthPrivateKeyWalletData
  | EthereumAuthPrivateKeyWalletData

export interface EthereumReadonlyWalletData {
  readonly coin: "ethereum"
  readonly type: "readonly"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: ZeroHexString
}

export interface EthereumUnauthPrivateKeyWalletData {
  readonly coin: "ethereum"
  readonly type: "privateKey"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: ZeroHexString

  readonly privateKey: ZeroHexString
}

export interface EthereumAuthPrivateKeyWalletData {
  readonly coin: "ethereum"
  readonly type: "authPrivateKey"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: ZeroHexString

  readonly privateKey: {
    readonly ivBase64: string,
    readonly idBase64: string
  }
}

export interface EthereumSeededWalletData {
  readonly coin: "ethereum"
  readonly type: "seeded"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: ZeroHexString

  readonly seed: SeedRef
  readonly path: string
}

export interface EthereumTrezorWalletData {
  readonly coin: "ethereum"
  readonly type: "trezor"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: ZeroHexString

  readonly path: string
}

export namespace BgWallet {

  export namespace All {

    export namespace BySeed {

      export type Key = string
      export type Data = Wallet[]
      export type Fail = never

      export function key(uuid: string) {
        return `walletsBySeed/${uuid}`
      }

      export function schema(uuid: string, storage: IDBStorage) {
        return createQuery<Key, Data, Fail>({ key: key(uuid), storage })
      }

    }

    export type Key = string
    export type Data = Wallet[]
    export type Fail = never

    export const key = `wallets`

    export type Schema = ReturnType<typeof schema>

    export function schema(storage: IDBStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

  export type Key = string
  export type Data = WalletData
  export type Fail = never

  export function key(uuid: string) {
    return `wallet/${uuid}`
  }

  export function schema(uuid: string, storage: IDBStorage) {
    const indexer = async (states: States<Data, Fail>) => {
      const { current, previous = current } = states

      const previousData = previous.real?.data
      const currentData = current.real?.data

      await All.schema(storage).mutate(Mutators.mapData((d = new Data([])) => {
        if (previousData?.inner.uuid === currentData?.inner.uuid)
          return d
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid))
        if (currentData != null)
          d = d.mapSync(p => [...p, WalletRef.from(currentData.inner)])
        return d
      }))

      if (currentData?.inner.type === "seeded") {
        const { seed } = currentData.inner

        const walletsBySeedQuery = All.BySeed.schema(seed.uuid, storage)

        await walletsBySeedQuery.mutate(Mutators.mapData((d = new Data([])) => {
          if (previousData?.inner.uuid === currentData?.inner.uuid)
            return d
          if (previousData != null)
            d = d.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid))
          if (currentData != null)
            d = d.mapSync(p => [...p, WalletRef.from(currentData.inner)])
          return d
        }))
      }
    }

    return createQuery<Key, Data, Fail>({ key: key(uuid), indexer, storage })
  }

}

export type EthereumQueryKey<T> = RpcRequestPreinit<T> & {
  [key: string]: unknown
  chainId: number
}

export interface EthereumFetchParams {
  noCheck?: boolean
}