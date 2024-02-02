import { Fixed, ZeroHexString } from "@hazae41/cubane"
import { Data, IDBStorage, States, createQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { None, Some } from "@hazae41/option"
import { SeedRef } from "../seeds/data"
import { BgTotal } from "../unknown/data"

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

  readonly trashed?: boolean
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

  readonly trashed?: boolean
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

  readonly trashed?: boolean
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

  readonly trashed?: boolean
}

export namespace BgWallet {

  export namespace All {

    export namespace Trashed {

      export type Key = string
      export type Data = Wallet[]
      export type Fail = never

      export const key = `trashedWallets`

      export type Schema = ReturnType<typeof schema>

      export function schema(storage: IDBStorage) {
        return createQuery<Key, Data, Fail>({ key, storage })
      }

    }

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

    export namespace ByAddress {

      export type Key = string
      export type Data = Wallet[]
      export type Fail = never

      export function key(address: string) {
        return `walletsByAddress/${address}`
      }

      export function schema(account: ZeroHexString, storage: IDBStorage) {
        const indexer = async (states: States<Data, Fail>) => {
          const { current, previous } = states

          const previousData = previous?.real?.current.ok()?.get()
          const currentData = current.real?.current.ok()?.get()

          const [array = []] = [currentData]

          await BgTotal.Balance.Priced.ByAddress.Record.schema("usd", storage).mutate(s => {
            const current = s.current

            const [{ value = new Fixed(0n, 0) } = {}] = [current?.ok().get()?.[account]]

            const inner = { value, count: array.length }

            if (current == null)
              return new Some(new Data({ [account]: inner }))
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(c => ({ ...c, [account]: inner })))
          })
        }

        return createQuery<Key, Data, Fail>({
          key: key(account),
          indexer,
          storage
        })
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
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.get()
      const currentData = current.real?.current.ok()?.get()

      if (previousData != null && (previousData.uuid !== currentData?.uuid || previousData.trashed !== currentData?.trashed) && !previousData.trashed) {
        await All.schema(storage).mutate(s => {
          const current = s.current

          if (current == null)
            return new None()
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => p.filter(x => x.uuid !== previousData.uuid)))
        })

        await All.ByAddress.schema(previousData.address, storage)?.mutate(s => {
          const current = s.current

          if (current == null)
            return new None()
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => p.filter(x => x.uuid !== previousData.uuid)))
        })

        if (previousData.type === "seeded") {
          const { seed } = previousData

          await All.BySeed.schema(seed.uuid, storage)?.mutate(s => {
            const current = s.current

            if (current == null)
              return new None()
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(p => p.filter(x => x.uuid !== previousData.uuid)))
          })
        }
      }

      if (previousData != null && (previousData.uuid !== currentData?.uuid || previousData.trashed !== currentData?.trashed) && previousData.trashed) {
        await All.Trashed.schema(storage).mutate(s => {
          const current = s.current

          if (current == null)
            return new None()
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => p.filter(x => x.uuid !== previousData.uuid)))
        })
      }

      if (currentData != null && (currentData.uuid !== previousData?.uuid || currentData.trashed !== previousData?.trashed) && !currentData.trashed) {
        await All.schema(storage).mutate(s => {
          const current = s.current

          if (current == null)
            return new Some(new Data([WalletRef.from(currentData)]))
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => [...p, WalletRef.from(currentData)]))
        })

        await All.ByAddress.schema(currentData.address, storage)?.mutate(s => {
          const current = s.current

          if (current == null)
            return new Some(new Data([WalletRef.from(currentData)]))
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => [...p, WalletRef.from(currentData)]))
        })

        if (currentData.type === "seeded") {
          const { seed } = currentData

          await All.BySeed.schema(seed.uuid, storage)?.mutate(s => {
            const current = s.current

            if (current == null)
              return new Some(new Data([WalletRef.from(currentData)]))
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(p => [...p, WalletRef.from(currentData)]))
          })
        }
      }

      if (currentData != null && (currentData.uuid !== previousData?.uuid || currentData.trashed !== previousData?.trashed) && currentData.trashed) {
        await All.Trashed.schema(storage).mutate(s => {
          const current = s.current

          if (current == null)
            return new Some(new Data([WalletRef.from(currentData)]))
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => [...p, WalletRef.from(currentData)]))
        })
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