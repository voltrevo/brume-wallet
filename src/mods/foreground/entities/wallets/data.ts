import { BigIntToHex } from "@/libs/bigints/bigints"
import { ContractTokenInfo, EthereumChain, PairInfo } from "@/libs/ethereum/mods/chain"
import { Fixed, FixedInit } from "@/libs/fixed/fixed"
import { useEffectButNotFirstTime } from "@/libs/react/effect"
import { WebAuthnStorage } from "@/libs/webauthn/webauthn"
import { Seed } from "@/mods/background/service_worker/entities/seeds/data"
import { BgEns, EthereumAuthPrivateKeyWalletData, EthereumFetchParams, EthereumQueryKey, EthereumSeededWalletData, EthereumUnauthPrivateKeyWalletData, EthereumWalletData, Wallet, WalletData } from "@/mods/background/service_worker/entities/wallets/data"
import { Base16 } from "@hazae41/base16"
import { Base64 } from "@hazae41/base64"
import { Abi, ZeroHexString } from "@hazae41/cubane"
import { Data, Fetched, FetcherMore, createQuery, useError, useFallback, useFetch, useQuery, useVisible } from "@hazae41/glacier"
import { RpcRequestPreinit, RpcResponse } from "@hazae41/jsonrpc"
import { Nullable, Option } from "@hazae41/option"
import { Ok, Panic, Result } from "@hazae41/result"
import { Transaction, ethers } from "ethers"
import { useMemo } from "react"
import { Background } from "../../background/background"
import { useBackground } from "../../background/context"
import { useSubscribe } from "../../storage/storage"
import { UserStorage, useUserStorage } from "../../storage/user"
import { SeedInstance } from "../seeds/all/data"

export interface WalletProps {
  wallet: Wallet
}

export function getWallet(uuid: Nullable<string>, storage: UserStorage) {
  if (uuid == null)
    return undefined

  return createQuery<string, WalletData, never>({ key: `wallet/${uuid}`, storage })
}

export function useWallet(uuid: Nullable<string>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getWallet, [uuid, storage])
  useSubscribe(query as any, storage)
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
      const seedQuery = Seed.Foreground.schema(data.seed.uuid, storage)
      const seedState = await seedQuery?.state.then(r => r.throw(t))
      const seedData = Option.wrap(seedState?.data?.inner).ok().throw(t)

      const seed = await SeedInstance.tryFrom(seedData, background).then(r => r.throw(t))

      return new Ok(new EthereumSeededWalletInstance(data, seed))
    })
  }

  async tryGetPrivateKey(background: Background): Promise<Result<string, Error>> {
    return await this.seed.tryGetPrivateKey(this.data.path, background)
  }

  async trySignPersonalMessage(message: string, background: Background): Promise<Result<string, Error>> {
    return await this.seed.trySignPersonalMessage(this.data.path, message, background)
  }

  async trySignTransaction(transaction: Transaction, background: Background): Promise<Result<string, Error>> {
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

  async tryGetPrivateKey(background: Background): Promise<Result<string, Error>> {
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

  async trySignTransaction(transaction: Transaction, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(background).then(r => r.throw(t))

      const signature = Result.runAndDoubleWrapSync(() => {
        return new ethers.Wallet(privateKey).signingKey.sign(transaction.unsignedHash).serialized
      }).throw(t)

      return new Ok(signature)
    })
  }

  async trySignEIP712HashedMessage(data: Abi.Typed.TypedData, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(background).then(r => r.throw(t))

      delete (data.types as any)["EIP712Domain"]

      const signature = await Result.runAndDoubleWrap(async () => {
        return await new ethers.Wallet(privateKey).signTypedData(data.domain, data.types, data.message)
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

  async tryGetPrivateKey(background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const { idBase64, ivBase64 } = this.data.privateKey

      const id = Base64.get().tryDecodePadded(idBase64).throw(t).copyAndDispose()
      const cipher = await WebAuthnStorage.get(id).then(r => r.throw(t))
      const cipherBase64 = Base64.get().tryEncodePadded(cipher).throw(t)

      const privateKeyBase64 = await background.tryRequest<string>({
        method: "brume_decrypt",
        params: [ivBase64, cipherBase64]
      }).then(r => r.throw(t).throw(t))

      using privateKeyMemory = Base64.get().tryDecodePadded(privateKeyBase64).throw(t)
      return new Ok(`0x${Base16.get().tryEncode(privateKeyMemory).throw(t)}`)
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

  async trySignTransaction(transaction: Transaction, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(background).then(r => r.throw(t))

      const signature = Result.runAndDoubleWrapSync(() => {
        return new ethers.Wallet(privateKey).signingKey.sign(transaction.unsignedHash).serialized
      }).throw(t)

      return new Ok(signature)
    })
  }

  async trySignEIP712HashedMessage(data: Abi.Typed.TypedData, background: Background): Promise<Result<string, Error>> {
    return await Result.unthrow(async t => {
      const privateKey = await this.tryGetPrivateKey(background).then(r => r.throw(t))

      delete (data.types as any)["EIP712Domain"]

      const signature = await Result.runAndDoubleWrap(async () => {
        return await new ethers.Wallet(privateKey).signTypedData(data.domain, data.types, data.message)
      }).then(r => r.throw(t))

      return new Ok(signature)
    })
  }

}

export interface EthereumContext {
  uuid: string,
  chain: EthereumChain,
  background: Background
}

export interface EthereumContextProps {
  context: EthereumContext
}

export function useEthereumContext(uuid: Nullable<string>, chain: Nullable<EthereumChain>) {
  const background = useBackground().unwrap()

  return useMemo<Nullable<EthereumContext>>(() => {
    if (uuid == null)
      return
    if (chain == null)
      return
    return { uuid, chain, background }
  }, [uuid, chain, background])
}

export async function tryFetch<T>(request: RpcRequestPreinit<unknown>, ethereum: EthereumContext, params?: Nullable<EthereumFetchParams>): Promise<Result<Fetched<T, Error>, Error>> {
  const { uuid, background, chain } = ethereum

  return await background.tryRequest<T>({
    method: "brume_eth_fetch",
    params: [uuid, chain.chainId, request, params]
  }).then(r => r.mapSync(x => Fetched.rewrap(x)))
}

export async function tryIndex<T>(request: RpcRequestPreinit<unknown>, ethereum: EthereumContext): Promise<Result<RpcResponse<T>, Error>> {
  const { uuid, background, chain } = ethereum

  return await background.tryRequest<T>({
    method: "brume_eth_index",
    params: [uuid, chain.chainId, request]
  })
}

export function getTotalPricedBalance(coin: "usd", storage: UserStorage) {
  return createQuery<string, FixedInit, never>({ key: `totalPricedBalance/${coin}`, storage })
}

export function useTotalPricedBalance(coin: "usd") {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getTotalPricedBalance, [coin, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  useFallback(query, () => new Data(new Fixed(0n, 0)))
  return query
}

export function getTotalWalletPricedBalance(address: string, coin: "usd", storage: UserStorage) {
  return createQuery<string, FixedInit, never>({ key: `totalWalletPricedBalance/${address}/${coin}`, storage })
}

export function useTotalWalletPricedBalance(address: string, coin: "usd") {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getTotalWalletPricedBalance, [address, coin, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  useFallback(query, () => new Data(new Fixed(0n, 0)))
  return query
}

export function getPricedBalance(account: string, coin: "usd", context: Nullable<EthereumContext>, storage: UserStorage) {
  if (context == null)
    return

  return createQuery<EthereumQueryKey<unknown>, FixedInit, Error>({
    key: {
      chainId: context.chain.chainId,
      method: "eth_getPricedBalance",
      params: [account, coin]
    },
    storage
  })
}

export function usePricedBalance(address: string, coin: "usd", context: Nullable<EthereumContext>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getPricedBalance, [address, coin, context, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  useFallback(query, () => new Data(new Fixed(0n, 0)))
  return query
}

export function getBalance(address: string, context: Nullable<EthereumContext>, storage: UserStorage) {
  if (context == null)
    return

  const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await tryFetch<FixedInit>(request, context)

  return createQuery<EthereumQueryKey<unknown>, FixedInit, Error>({
    key: {
      version: 2,
      chainId: context.chain.chainId,
      method: "eth_getBalance",
      params: [address, "pending"]
    },
    fetcher,
    storage
  })
}

export function useBalance(address: string, context: Nullable<EthereumContext>, prices: Nullable<FixedInit>[]) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getBalance, [address, context, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  useFallback(query, () => new Data(new Fixed(0n, 0)))

  useEffectButNotFirstTime(() => {
    if (context == null)
      return
    tryIndex(query.key, context)
      .then(r => r.ignore())
      .catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, ...prices])

  return query
}

export function getTokenPricedBalance(context: Nullable<EthereumContext>, account: string, token: ContractTokenInfo, coin: "usd", storage: UserStorage) {
  if (context == null)
    return

  return createQuery<EthereumQueryKey<unknown>, FixedInit, Error>({
    key: {
      chainId: context.chain.chainId,
      method: "eth_getTokenPricedBalance",
      params: [account, token.address, coin]
    },
    storage
  })
}

export function useTokenPricedBalance(context: Nullable<EthereumContext>, address: string, token: ContractTokenInfo, coin: "usd") {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getTokenPricedBalance, [context, address, token, coin, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  useFallback(query, () => new Data(new Fixed(0n, 0)))
  return query
}

export function getTokenBalance(address: string, token: ContractTokenInfo, context: Nullable<EthereumContext>, storage: UserStorage) {
  if (context == null)
    return

  const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await tryFetch<FixedInit>(request, context)

  return createQuery<EthereumQueryKey<unknown>, FixedInit, Error>({
    key: {
      chainId: context.chain.chainId,
      method: "eth_getTokenBalance",
      params: [address, token.address, "pending"]
    },
    fetcher,
    storage
  })
}

export function useTokenBalance(address: string, token: ContractTokenInfo, context: Nullable<EthereumContext>, prices: Nullable<FixedInit>[]) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getTokenBalance, [address, token, context, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  useFallback(query, () => new Data(new Fixed(0n, 0)))

  useEffectButNotFirstTime(() => {
    if (context == null)
      return
    tryIndex(query.key, context)
      .then(r => r.ignore())
      .catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, ...prices])

  return query
}

export function getNonceSchema(address: Nullable<string>, context: Nullable<EthereumContext>, storage: UserStorage) {
  if (address == null)
    return undefined
  if (context == null)
    return undefined

  const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await tryFetch<string>(request, context).then(r => r.mapSync(r => r.mapSync(BigInt)))

  return createQuery<EthereumQueryKey<unknown>, bigint, Error>({
    key: {
      chainId: context.chain.chainId,
      method: "eth_getTransactionCount",
      params: [address, "pending"]
    },
    fetcher,
    storage,
    dataSerializer: BigIntToHex,
  })
}

export function useNonce(address: Nullable<string>, context: Nullable<EthereumContext>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getNonceSchema, [address, context, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}

export function getGasPriceSchema(context: Nullable<EthereumContext>, storage: UserStorage) {
  if (context == null)
    return undefined

  const fetcher = async (request: RpcRequestPreinit<unknown>) =>
    await tryFetch<string>(request, context).then(r => r.mapSync(r => r.mapSync(BigInt)))

  return createQuery<EthereumQueryKey<unknown>, bigint, Error>({
    key: {
      chainId: context.chain.chainId,
      method: "eth_gasPrice",
      params: []
    },
    fetcher,
    storage,
    dataSerializer: BigIntToHex
  })
}

export function useGasPrice(ethereum: Nullable<EthereumContext>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getGasPriceSchema, [ethereum, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}

export function useMaxPriorityFeePerGas() {

}

export function getPairPrice(context: Nullable<EthereumContext>, pair: PairInfo, storage: UserStorage) {
  if (context == null)
    return

  const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await tryFetch<FixedInit>(request, context)

  return createQuery<EthereumQueryKey<unknown>, FixedInit, Error>({
    key: {
      chainId: context.chain.chainId,
      method: "eth_getPairPrice",
      params: [pair.address]
    },
    fetcher,
    storage
  })
}

export function usePairPrice(ethereum: Nullable<EthereumContext>, pair: PairInfo) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(getPairPrice, [ethereum, pair, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}

export namespace FgEns {

  export namespace Lookup {

    export function schema(name: Nullable<string>, context: Nullable<EthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (name == null)
        return

      const fetcher = async (request: RpcRequestPreinit<unknown>) =>
        await tryFetch<ZeroHexString>(request, context)

      return createQuery<EthereumQueryKey<unknown>, ZeroHexString, Error>({
        key: BgEns.Lookup.key(name),
        fetcher,
        storage
      })
    }

  }

  export namespace Reverse {

    export function schema(address: Nullable<ZeroHexString>, context: Nullable<EthereumContext>, storage: UserStorage) {
      if (context == null)
        return
      if (address == null)
        return

      const fetcher = async (request: RpcRequestPreinit<unknown>) =>
        await tryFetch<ZeroHexString>(request, context)

      return createQuery<EthereumQueryKey<unknown>, Nullable<string>, Error>({
        key: BgEns.Reverse.key(address),
        fetcher,
        storage
      })
    }

  }

}

export function useEnsLookup(name: Nullable<string>, ethereum: Nullable<EthereumContext>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(FgEns.Lookup.schema, [name, ethereum, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}

export function useEnsReverse(address: Nullable<ZeroHexString>, ethereum: Nullable<EthereumContext>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(FgEns.Reverse.schema, [address, ethereum, storage])
  useFetch(query)
  useVisible(query)
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}

export function useEnsReverseNoFetch(address: Nullable<ZeroHexString>, ethereum: Nullable<EthereumContext>) {
  const storage = useUserStorage().unwrap()
  const query = useQuery(FgEns.Reverse.schema, [address, ethereum, storage])
  useSubscribe(query, storage)
  useError(query, console.error)
  return query
}