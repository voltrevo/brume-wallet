import { ChainData } from "@/libs/ethereum/mods/chain"
import { BgWallet, EthereumAuthPrivateKeyWalletData, EthereumChainlessRpcRequestPreinit, EthereumSeededWalletData, EthereumUnauthPrivateKeyWalletData, EthereumWalletData, Wallet, WalletRef } from "@/mods/background/service_worker/entities/wallets/data"
import { SeedQuery } from "@/mods/universal/entities/seeds"
import { Base16 } from "@hazae41/base16"
import { Base64 } from "@hazae41/base64"
import { Abi, Fixed, ZeroHexString } from "@hazae41/cubane"
import { Data, Fetched, States, createQuery, useQuery } from "@hazae41/glacier"
import { None, Nullable, Option, Some } from "@hazae41/option"
import { Panic } from "@hazae41/result"
import { WebAuthnStorage } from "@hazae41/webauthnstorage"
import { Transaction, ethers } from "ethers"
import { useMemo } from "react"
import { Background } from "../../background/background"
import { useBackgroundContext } from "../../background/context"
import { UserStorage, useUserStorageContext } from "../../storage/user"
import { SeedInstance } from "../seeds/all/helpers"
import { FgTotal } from "../unknown/data"

export interface WalletProps {
  readonly wallet: Wallet
}

export namespace FgWallet {

  export namespace All {

    export namespace Trashed {

      export type K = BgWallet.All.Trashed.K
      export type D = BgWallet.All.Trashed.D
      export type F = BgWallet.All.Trashed.F

      export const key = BgWallet.All.Trashed.key

      export function schema(storage: UserStorage) {
        return createQuery<K, D, F>({ key, storage })
      }

    }

    export namespace BySeed {

      export type K = BgWallet.All.BySeed.K
      export type D = BgWallet.All.BySeed.D
      export type F = BgWallet.All.BySeed.F

      export const key = BgWallet.All.BySeed.key

      export function schema(uuid: Nullable<string>, storage: UserStorage) {
        if (uuid == null)
          return

        return createQuery<K, D, F>({ key: key(uuid), storage })
      }

    }

    export namespace ByAddress {

      export type K = BgWallet.All.ByAddress.K
      export type D = BgWallet.All.ByAddress.D
      export type F = BgWallet.All.ByAddress.F

      export const key = BgWallet.All.ByAddress.key

      export function schema(account: Nullable<string>, storage: UserStorage) {
        if (account == null)
          return

        const indexer = async (states: States<D, F>) => {
          const { current, previous } = states

          const previousData = previous?.real?.current.ok()?.getOrNull()
          const currentData = current.real?.current.ok()?.getOrNull()

          const [array = []] = [currentData]

          await FgTotal.Balance.Priced.ByAddress.Record.schema("usd", storage).mutateOrThrow(s => {
            const current = s.current

            const [{ value = new Fixed(0n, 0) } = {}] = [current?.ok().getOrNull()?.[account]]

            const inner = { value, count: array.length }

            if (current == null)
              return new Some(new Data({ [account]: inner }))
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(c => ({ ...c, [account]: inner })))
          })
        }

        return createQuery<K, D, F>({
          key: key(account),
          indexer,
          storage
        })
      }

    }

    export type K = BgWallet.All.K
    export type D = BgWallet.All.D
    export type F = BgWallet.All.F

    export const key = BgWallet.All.key

    export function schema(storage: UserStorage) {
      return createQuery<K, D, F>({ key, storage })
    }

  }

  export type K = BgWallet.K
  export type D = BgWallet.D
  export type F = BgWallet.F

  export const key = BgWallet.key

  export function schema(uuid: Nullable<string>, storage: UserStorage) {
    if (uuid == null)
      return

    const indexer = async (states: States<D, F>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.getOrNull()
      const currentData = current.real?.current.ok()?.getOrNull()

      if (previousData != null && (previousData.uuid !== currentData?.uuid || previousData.trashed !== currentData?.trashed) && !previousData.trashed) {
        await All.schema(storage).mutateOrThrow(s => {
          const current = s.current

          if (current == null)
            return new None()
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => p.filter(x => x.uuid !== previousData.uuid)))
        })

        await All.ByAddress.schema(previousData.address, storage)?.mutateOrThrow(s => {
          const current = s.current

          if (current == null)
            return new None()
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => p.filter(x => x.uuid !== previousData.uuid)))
        })

        if (previousData.type === "seeded") {
          const { seed } = previousData

          await All.BySeed.schema(seed.uuid, storage)?.mutateOrThrow(s => {
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
        await All.Trashed.schema(storage).mutateOrThrow(s => {
          const current = s.current

          if (current == null)
            return new None()
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => p.filter(x => x.uuid !== previousData.uuid)))
        })
      }

      if (currentData != null && (currentData.uuid !== previousData?.uuid || currentData.trashed !== previousData?.trashed) && !currentData.trashed) {
        await All.schema(storage).mutateOrThrow(s => {
          const current = s.current

          if (current == null)
            return new Some(new Data([WalletRef.from(currentData)]))
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => [...p, WalletRef.from(currentData)]))
        })

        await All.ByAddress.schema(currentData.address, storage)?.mutateOrThrow(s => {
          const current = s.current

          if (current == null)
            return new Some(new Data([WalletRef.from(currentData)]))
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => [...p, WalletRef.from(currentData)]))
        })

        if (currentData.type === "seeded") {
          const { seed } = currentData

          await All.BySeed.schema(seed.uuid, storage)?.mutateOrThrow(s => {
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
        await All.Trashed.schema(storage).mutateOrThrow(s => {
          const current = s.current

          if (current == null)
            return new Some(new Data([WalletRef.from(currentData)]))
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => [...p, WalletRef.from(currentData)]))
        })
      }
    }

    return createQuery<K, D, F>({ key: key(uuid), indexer, storage })
  }

}

export function useWallet(uuid: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgWallet.schema, [uuid, storage])

  return query
}

export function useWallets() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgWallet.All.schema, [storage])

  return query
}

export function useTrashedWallets() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgWallet.All.Trashed.schema, [storage])

  return query
}

export function useWalletsBySeed(uuid: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgWallet.All.BySeed.schema, [uuid, storage])

  return query
}

export type EthereumWalletInstance =
  | EthereumUnauthPrivateKeyWalletInstance
  | EthereumAuthPrivateKeyWalletInstance
  | EthereumSeededWalletInstance

export namespace EthereumWalletInstance {

  export async function createOrThrow(wallet: EthereumWalletData, background: Background) {
    if (wallet.type === "privateKey")
      return await EthereumUnauthPrivateKeyWalletInstance.createOrThrow(wallet, background)
    if (wallet.type === "authPrivateKey")
      return await EthereumAuthPrivateKeyWalletInstance.createOrThrow(wallet, background)
    if (wallet.type === "seeded")
      return await EthereumSeededWalletInstance.createOrThrow(wallet, background)
    if (wallet.type === "readonly")
      throw new Panic()
    return wallet satisfies never
  }

}

export class EthereumSeededWalletInstance {

  constructor(
    readonly data: EthereumSeededWalletData,
    readonly seed: SeedInstance,
  ) { }

  static async createOrThrow(data: EthereumSeededWalletData, background: Background): Promise<EthereumSeededWalletInstance> {
    const storage = new UserStorage(background)
    const seedQuery = SeedQuery.create(data.seed.uuid, storage)
    const seedState = await seedQuery?.state
    const seedData = Option.wrap(seedState?.data?.get()).getOrThrow()

    const seed = await SeedInstance.createOrThrow(seedData, background)

    return new EthereumSeededWalletInstance(data, seed)
  }

  async getPrivateKeyOrThrow(background: Background): Promise<ZeroHexString> {
    return await this.seed.getPrivateKeyOrThrow(this.data.path, background)
  }

  async signPersonalMessageOrThrow(message: string, background: Background): Promise<ZeroHexString> {
    return await this.seed.signPersonalMessageOrThrow(this.data.path, message, background)
  }

  async signTransactionOrThrow(transaction: Transaction, background: Background): Promise<ZeroHexString> {
    return await this.seed.signTransactionOrThrow(this.data.path, transaction, background)
  }

  async signEIP712HashedMessageOrThrow(data: Abi.Typed.TypedData, background: Background): Promise<ZeroHexString> {
    return await this.seed.signEIP712HashedMessageOrThrow(this.data.path, data, background)
  }

}

export class EthereumUnauthPrivateKeyWalletInstance {

  constructor(
    readonly data: EthereumUnauthPrivateKeyWalletData
  ) { }

  static async createOrThrow(data: EthereumUnauthPrivateKeyWalletData, background: Background): Promise<EthereumUnauthPrivateKeyWalletInstance> {
    return new EthereumUnauthPrivateKeyWalletInstance(data)
  }

  async getPrivateKeyOrThrow(background: Background): Promise<ZeroHexString> {
    return this.data.privateKey
  }

  async signPersonalMessageOrThrow(message: string, background: Background): Promise<ZeroHexString> {
    const privateKey = await this.getPrivateKeyOrThrow(background)

    const signature = await new ethers.Wallet(privateKey).signMessage(message)

    return signature as ZeroHexString
  }

  async signTransactionOrThrow(transaction: Transaction, background: Background): Promise<ZeroHexString> {
    const privateKey = await this.getPrivateKeyOrThrow(background)

    const signature = new ethers.Wallet(privateKey).signingKey.sign(transaction.unsignedHash).serialized

    return signature as ZeroHexString
  }

  async signEIP712HashedMessageOrThrow(data: Abi.Typed.TypedData, background: Background): Promise<ZeroHexString> {
    const privateKey = await this.getPrivateKeyOrThrow(background)

    delete (data.types as any)["EIP712Domain"]

    const signature = await new ethers.Wallet(privateKey).signTypedData(data.domain as any, data.types as any, data.message)

    return signature as ZeroHexString
  }

}

export class EthereumAuthPrivateKeyWalletInstance {

  constructor(
    readonly data: EthereumAuthPrivateKeyWalletData
  ) { }

  static async createOrThrow(data: EthereumAuthPrivateKeyWalletData, background: Background): Promise<EthereumAuthPrivateKeyWalletInstance> {
    return new EthereumAuthPrivateKeyWalletInstance(data)
  }

  async getPrivateKeyOrThrow(background: Background): Promise<ZeroHexString> {
    const { idBase64, ivBase64 } = this.data.privateKey

    using id = Base64.get().getOrThrow().decodePaddedOrThrow(idBase64)

    const cipher = await WebAuthnStorage.getOrThrow(id.bytes)
    const cipherBase64 = Base64.get().getOrThrow().encodePaddedOrThrow(cipher)

    const privateKeyBase64 = await background.requestOrThrow<string>({
      method: "brume_decrypt",
      params: [ivBase64, cipherBase64]
    }).then(r => r.getOrThrow())

    using privateKeyMemory = Base64.get().getOrThrow().decodePaddedOrThrow(privateKeyBase64)

    return `0x${Base16.get().getOrThrow().encodeOrThrow(privateKeyMemory)}` as ZeroHexString
  }

  async signPersonalMessageOrThrow(message: string, background: Background): Promise<ZeroHexString> {
    const privateKey = await this.getPrivateKeyOrThrow(background)

    const signature = await new ethers.Wallet(privateKey).signMessage(message)

    return signature as ZeroHexString
  }

  async signTransactionOrThrow(transaction: Transaction, background: Background): Promise<ZeroHexString> {
    const privateKey = await this.getPrivateKeyOrThrow(background)

    const signature = new ethers.Wallet(privateKey).signingKey.sign(transaction.unsignedHash).serialized

    return signature as ZeroHexString
  }

  async signEIP712HashedMessageOrThrow(data: Abi.Typed.TypedData, background: Background): Promise<ZeroHexString> {
    const privateKey = await this.getPrivateKeyOrThrow(background)

    delete (data.types as any)["EIP712Domain"]

    const signature = await new ethers.Wallet(privateKey).signTypedData(data.domain as any, data.types as any, data.message)

    return signature as ZeroHexString
  }

}

export interface EthereumContextProps {
  readonly context: FgEthereumContext
}

export class FgEthereumContext {

  constructor(
    readonly uuid: string,
    readonly chain: ChainData,
    readonly background: Background
  ) { }

  switch(chain: ChainData) {
    const { uuid, background } = this

    return new FgEthereumContext(uuid, chain, background)
  }

  async fetchOrFail<T>(init: EthereumChainlessRpcRequestPreinit<unknown>, more: RequestInit = {}): Promise<Fetched<T, Error>> {
    const { uuid, background, chain } = this

    return await background.requestOrThrow<T>({
      method: "brume_eth_fetch",
      params: [uuid, chain.chainId, init]
    }).then(r => Fetched.rewrap(r))
  }

  async customFetchOrFail<T>(init: EthereumChainlessRpcRequestPreinit<unknown>, more: RequestInit = {}): Promise<Fetched<T, Error>> {
    const { uuid, background, chain } = this

    return await background.requestOrThrow<T>({
      method: "brume_eth_custom_fetch",
      params: [uuid, chain.chainId, init]
    }).then(r => Fetched.rewrap(r))
  }

}

export function useEthereumContext(uuid: Nullable<string>, chain: Nullable<ChainData>) {
  const background = useBackgroundContext().getOrThrow()

  const maybeContext = useMemo<Nullable<FgEthereumContext>>(() => {
    if (uuid == null)
      return
    if (chain == null)
      return
    return new FgEthereumContext(uuid, chain, background)
  }, [uuid, chain, background])

  return Option.wrap(maybeContext)
}