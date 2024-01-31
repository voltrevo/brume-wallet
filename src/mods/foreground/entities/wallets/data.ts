import { ChainData } from "@/libs/ethereum/mods/chain"
import { WebAuthnStorage } from "@/libs/webauthn/webauthn"
import { BgWallet, EthereumAuthPrivateKeyWalletData, EthereumFetchParams, EthereumSeededWalletData, EthereumUnauthPrivateKeyWalletData, EthereumWalletData, Wallet, WalletRef } from "@/mods/background/service_worker/entities/wallets/data"
import { Base16 } from "@hazae41/base16"
import { Base64 } from "@hazae41/base64"
import { Abi, ZeroHexString } from "@hazae41/cubane"
import { Data, Fetched, States, createQuery, useQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { None, Nullable, Option, Some } from "@hazae41/option"
import { Ok, Panic, Result } from "@hazae41/result"
import { Transaction, ethers } from "ethers"
import { useMemo } from "react"
import { Background } from "../../background/background"
import { useBackgroundContext } from "../../background/context"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorageContext } from "../../storage/user"
import { SeedInstance } from "../seeds/all/helpers"
import { FgSeed } from "../seeds/data"

export interface WalletProps {
  readonly wallet: Wallet
}

export namespace FgWallet {

  export namespace All {

    export namespace Trashed {

      export type Key = BgWallet.All.Trashed.Key
      export type Data = BgWallet.All.Trashed.Data
      export type Fail = BgWallet.All.Trashed.Fail

      export const key = BgWallet.All.Trashed.key

      export function schema(storage: UserStorage) {
        return createQuery<Key, Data, Fail>({ key, storage })
      }

    }

    export namespace BySeed {

      export type Key = BgWallet.All.BySeed.Key
      export type Data = BgWallet.All.BySeed.Data
      export type Fail = BgWallet.All.BySeed.Fail

      export const key = BgWallet.All.BySeed.key

      export function schema(uuid: Nullable<string>, storage: UserStorage) {
        if (uuid == null)
          return

        return createQuery<Key, Data, Fail>({ key: key(uuid), storage })
      }

    }

    export type Key = BgWallet.All.Key
    export type Data = BgWallet.All.Data
    export type Fail = BgWallet.All.Fail

    export const key = BgWallet.All.key

    export function schema(storage: UserStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

  export type Key = BgWallet.Key
  export type Data = BgWallet.Data
  export type Fail = BgWallet.Fail

  export const key = BgWallet.key

  export function schema(uuid: Nullable<string>, storage: UserStorage) {
    if (uuid == null)
      return

    const indexer = async (states: States<Data, Fail>) => {
      const { current, previous } = states

      const previousData = previous?.data
      const currentData = current.data

      if (previousData != null && (previousData.inner.uuid !== currentData?.inner.uuid || previousData.inner.trashed !== currentData?.inner.trashed) && !previousData.inner.trashed) {
        await All.schema(storage).mutate(s => {
          const current = s.current

          if (current == null)
            return new None()
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid)))
        })

        if (previousData.inner.type === "seeded") {
          const { seed } = previousData.inner

          await All.BySeed.schema(seed.uuid, storage)?.mutate(s => {
            const current = s.current

            if (current == null)
              return new None()
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid)))
          })
        }
      }

      if (previousData != null && (previousData.inner.uuid !== currentData?.inner.uuid || previousData.inner.trashed !== currentData?.inner.trashed) && previousData.inner.trashed) {
        await All.Trashed.schema(storage).mutate(s => {
          const current = s.current

          if (current == null)
            return new None()
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid)))
        })
      }

      if (currentData != null && (currentData.inner.uuid !== previousData?.inner.uuid || currentData.inner.trashed !== previousData?.inner.trashed) && !currentData.inner.trashed) {
        await All.schema(storage).mutate(s => {
          const current = s.current

          if (current == null)
            return new Some(new Data([WalletRef.from(currentData.inner)]))
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => [...p, WalletRef.from(currentData.inner)]))
        })

        if (currentData.inner.type === "seeded") {
          const { seed } = currentData.inner

          await All.BySeed.schema(seed.uuid, storage)?.mutate(s => {
            const current = s.current

            if (current == null)
              return new Some(new Data([WalletRef.from(currentData.inner)]))
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(p => [...p, WalletRef.from(currentData.inner)]))
          })
        }
      }

      if (currentData != null && (currentData.inner.uuid !== previousData?.inner.uuid || currentData.inner.trashed !== previousData?.inner.trashed) && currentData.inner.trashed) {
        await All.Trashed.schema(storage).mutate(s => {
          const current = s.current

          if (current == null)
            return new Some(new Data([WalletRef.from(currentData.inner)]))
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(p => [...p, WalletRef.from(currentData.inner)]))
        })
      }
    }

    return createQuery<Key, Data, Fail>({ key: key(uuid), indexer, storage })
  }

}

export function useWallet(uuid: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgWallet.schema, [uuid, storage])
  useSubscribe(query, storage)
  return query
}

export function useWallets() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgWallet.All.schema, [storage])
  useSubscribe(query, storage)
  return query
}

export function useTrashedWallets() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgWallet.All.Trashed.schema, [storage])
  useSubscribe(query, storage)
  return query
}

export function useWalletsBySeed(uuid: Nullable<string>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgWallet.All.BySeed.schema, [uuid, storage])
  useSubscribe(query, storage)
  return query
}

export type EthereumWalletInstance =
  | EthereumUnauthPrivateKeyWalletInstance
  | EthereumAuthPrivateKeyWalletInstance
  | EthereumSeededWalletInstance

export namespace EthereumWalletInstance {

  export async function tryFrom(wallet: EthereumWalletData, background: Background) {
    if (wallet.type === "privateKey")
      return await EthereumUnauthPrivateKeyWalletInstance.tryNew(wallet, background)
    if (wallet.type === "authPrivateKey")
      return await EthereumAuthPrivateKeyWalletInstance.tryNew(wallet, background)
    if (wallet.type === "seeded")
      return await EthereumSeededWalletInstance.tryNew(wallet, background)
    throw new Panic()
  }

}

export class EthereumSeededWalletInstance {

  constructor(
    readonly data: EthereumSeededWalletData,
    readonly seed: SeedInstance,
  ) { }

  static async tryNew(data: EthereumSeededWalletData, background: Background): Promise<Result<EthereumSeededWalletInstance, Error>> {
    return await Result.unthrow(async t => {
      const storage = new UserStorage(background)
      const seedQuery = FgSeed.schema(data.seed.uuid, storage)
      const seedState = await seedQuery?.state
      const seedData = Option.wrap(seedState?.data?.get()).ok().throw(t)

      const seed = await SeedInstance.tryFrom(seedData, background).then(r => r.throw(t))

      return new Ok(new EthereumSeededWalletInstance(data, seed))
    })
  }

  async tryGetPrivateKey(background: Background): Promise<Result<ZeroHexString, Error>> {
    return await this.seed.tryGetPrivateKey(this.data.path, background)
  }

  async trySignPersonalMessage(message: string, background: Background): Promise<Result<string, Error>> {
    return await this.seed.trySignPersonalMessage(this.data.path, message, background)
  }

  async trySignTransaction(transaction: Transaction, background: Background): Promise<Result<ZeroHexString, Error>> {
    return await this.seed.trySignTransaction(this.data.path, transaction, background)
  }

  async trySignEIP712HashedMessage(data: Abi.Typed.TypedData, background: Background): Promise<Result<string, Error>> {
    return await this.seed.trySignEIP712HashedMessage(this.data.path, data, background)
  }

}

export class EthereumUnauthPrivateKeyWalletInstance {

  constructor(
    readonly data: EthereumUnauthPrivateKeyWalletData
  ) { }

  static async tryNew(data: EthereumUnauthPrivateKeyWalletData, background: Background): Promise<Result<EthereumUnauthPrivateKeyWalletInstance, Error>> {
    return new Ok(new EthereumUnauthPrivateKeyWalletInstance(data))
  }

  async tryGetPrivateKey(background: Background): Promise<Result<ZeroHexString, Error>> {
    return new Ok(this.data.privateKey)
  }

  async trySignPersonalMessage(message: string, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(background).then(r => r.throw(t))

      const signature = await Result.runAndDoubleWrap(async () => {
        return await new ethers.Wallet(privateKey).signMessage(message)
      }).then(r => r.throw(t))

      return new Ok(signature)
    })
  }

  async trySignTransaction(transaction: Transaction, background: Background): Promise<Result<ZeroHexString, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(background).then(r => r.throw(t))

      const signature = Result.runAndDoubleWrapSync(() => {
        return new ethers.Wallet(privateKey).signingKey.sign(transaction.unsignedHash).serialized as ZeroHexString
      }).throw(t)

      return new Ok(signature)
    })
  }

  async trySignEIP712HashedMessage(data: Abi.Typed.TypedData, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(background).then(r => r.throw(t))

      delete (data.types as any)["EIP712Domain"]

      const signature = await Result.runAndDoubleWrap(async () => {
        return await new ethers.Wallet(privateKey).signTypedData(data.domain as any, data.types as any, data.message)
      }).then(r => r.throw(t))

      return new Ok(signature)
    })
  }

}

export class EthereumAuthPrivateKeyWalletInstance {

  constructor(
    readonly data: EthereumAuthPrivateKeyWalletData
  ) { }

  static async tryNew(data: EthereumAuthPrivateKeyWalletData, background: Background): Promise<Result<EthereumAuthPrivateKeyWalletInstance, Error>> {
    return new Ok(new EthereumAuthPrivateKeyWalletInstance(data))
  }

  async tryGetPrivateKey(background: Background): Promise<Result<ZeroHexString, Error>> {
    return await Result.unthrow(async t => {
      const { idBase64, ivBase64 } = this.data.privateKey

      const id = Base64.get().tryDecodePadded(idBase64).throw(t).copyAndDispose()
      const cipher = await WebAuthnStorage.tryGet(id).then(r => r.throw(t))
      const cipherBase64 = Base64.get().tryEncodePadded(cipher).throw(t)

      const privateKeyBase64 = await background.tryRequest<string>({
        method: "brume_decrypt",
        params: [ivBase64, cipherBase64]
      }).then(r => r.throw(t).throw(t))

      using privateKeyMemory = Base64.get().tryDecodePadded(privateKeyBase64).throw(t)
      return new Ok(`0x${Base16.get().tryEncode(privateKeyMemory).throw(t)}` as ZeroHexString)
    })
  }

  async trySignPersonalMessage(message: string, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(background).then(r => r.throw(t))

      const signature = await Result.runAndDoubleWrap(async () => {
        return await new ethers.Wallet(privateKey).signMessage(message)
      }).then(r => r.throw(t))

      return new Ok(signature)
    })
  }

  async trySignTransaction(transaction: Transaction, background: Background): Promise<Result<ZeroHexString, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(background).then(r => r.throw(t))

      const signature = Result.runAndDoubleWrapSync(() => {
        return new ethers.Wallet(privateKey).signingKey.sign(transaction.unsignedHash).serialized as ZeroHexString
      }).throw(t)

      return new Ok(signature)
    })
  }

  async trySignEIP712HashedMessage(data: Abi.Typed.TypedData, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(background).then(r => r.throw(t))

      delete (data.types as any)["EIP712Domain"]

      const signature = await Result.runAndDoubleWrap(async () => {
        return await new ethers.Wallet(privateKey).signTypedData(data.domain as any, data.types as any, data.message)
      }).then(r => r.throw(t))

      return new Ok(signature)
    })
  }

}

export interface FgEthereumContext {
  readonly uuid: string,
  readonly chain: ChainData,
  readonly background: Background
}

export interface EthereumContextProps {
  readonly context: FgEthereumContext
}

export function useEthereumContext(uuid: Nullable<string>, chain: Nullable<ChainData>) {
  const background = useBackgroundContext().unwrap()

  const maybeContext = useMemo<Nullable<FgEthereumContext>>(() => {
    if (uuid == null)
      return
    if (chain == null)
      return
    return { uuid, chain, background }
  }, [uuid, chain, background])

  return maybeContext
}

export function useEthereumContext2(uuid: Nullable<string>, chain: Nullable<ChainData>) {
  const background = useBackgroundContext().unwrap()

  const maybeContext = useMemo<Nullable<FgEthereumContext>>(() => {
    if (uuid == null)
      return
    if (chain == null)
      return
    return { uuid, chain, background }
  }, [uuid, chain, background])

  return Option.wrap(maybeContext)
}

export async function customFetchOrFail<T>(request: RpcRequestPreinit<unknown> & EthereumFetchParams, ethereum: FgEthereumContext): Promise<Fetched<T, Error>> {
  const { uuid, background, chain } = ethereum

  return await background.tryRequest<T>({
    method: "brume_eth_custom_fetch",
    params: [uuid, chain.chainId, request]
  }).then(r => Fetched.rewrap(r.unwrap()))
}

export async function fetchOrFail<T>(request: RpcRequestPreinit<unknown> & EthereumFetchParams, ethereum: FgEthereumContext): Promise<Fetched<T, Error>> {
  const { uuid, background, chain } = ethereum

  return await background.tryRequest<T>({
    method: "brume_eth_fetch",
    params: [uuid, chain.chainId, request]
  }).then(r => Fetched.rewrap(r.unwrap()))
}