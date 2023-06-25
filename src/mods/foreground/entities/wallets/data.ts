import { BigInts, Fixed, FixedInit } from "@/libs/bigints/bigints"
import { EthereumChain } from "@/libs/ethereum/chain"
import { useObjectMemo } from "@/libs/react/memo"
import { RpcRequestPreinit } from "@/libs/rpc"
import { EthereumQueryKey } from "@/mods/background/service_worker/entities/wallets/data"
import { Optional } from "@hazae41/option"
import { Result } from "@hazae41/result"
import { Data, FetchError, Fetched, FetcherMore, Query, createQuerySchema, useCore, useError, useFallback, useFetch, useOnce, useQuery } from "@hazae41/xswr"
import { useCallback, useEffect } from "react"
import { Background, UserStorage } from "../../background/background"
import { useBackground } from "../../background/context"
import { useCurrentUser } from "../users/context"
import { User } from "../users/data"

export type Wallet =
  | WalletRef
  | WalletData

export interface WalletProps {
  wallet: Wallet
}

export interface WalletRef {
  ref: true
  uuid: string
}

export type WalletData =
  | EthereumPrivateKeyWallet

export interface EthereumPrivateKeyWallet {
  coin: "ethereum"
  type: "privateKey"

  uuid: string
  name: string,

  color: number,
  emoji: string

  privateKey: string
  address: string
}

export interface BitcoinPrivateKeyWallet {
  coin: "bitcoin"
  type: "privateKey"

  uuid: string
  name: string,

  color: number,
  emoji: string

  privateKey: string
  compressedAddress: string
  uncompressedAddress: string
}

export function getWallet(uuid: Optional<string>, background: Background) {
  if (uuid === undefined)
    return undefined

  const fetcher = async <T>(init: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await background.tryRequest<T>(init).then(r => r.mapSync(x => Fetched.rewrap(x)).mapErrSync(FetchError.from))

  return createQuerySchema<RpcRequestPreinit<unknown>, WalletData, Error>({
    method: "brume_getWallet",
    params: [uuid]
  }, fetcher)
}

export function useWallet(uuid: Optional<string>, background: Background) {
  const query = useQuery(getWallet, [uuid, background])
  useOnce(query)
  return query
}

export interface EthereumContext {
  user: User,
  background: Background
  wallet: Wallet,
  chain: EthereumChain,
}

export interface GeneralContext {
  user: User,
  background: Background
}

export interface EthereumContextProps {
  handle: EthereumContext
}

export function useGeneralContext() {
  const user = useCurrentUser()
  const background = useBackground()
  return useObjectMemo({ user, background })
}

export function useEthereumContext(wallet: Wallet, chain: EthereumChain): EthereumContext {
  const user = useCurrentUser()
  const background = useBackground()
  return useObjectMemo({ user, background, wallet, chain })
}

export async function tryFetch<T>(request: RpcRequestPreinit<unknown>, ethereum: EthereumContext): Promise<Result<Fetched<T, Error>, FetchError>> {
  const { background, wallet, chain } = ethereum

  return await background.tryRequest<T>({
    method: "brume_call_ethereum",
    params: [wallet.uuid, chain.chainId, request]
  }).then(r => r.mapSync(x => Fetched.rewrap(x)).mapErrSync(FetchError.from))
}

export function useSync<K, D, F>(query: Query<K, D, F>) {
  const core = useCore().unwrap()
  const { cacheKey } = query

  const sync = useCallback(async () => {
    if (cacheKey === undefined)
      return
    if (query.storage === undefined)
      return

    const stored = await query.storage.get?.(cacheKey)
    const unstored = await core.unstore(stored, query)
    await core.update(cacheKey, () => unstored, query)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [core, cacheKey])

  useEffect(() => {
    sync()
  }, [sync])
}

export function getTotalPricedBalance(context: GeneralContext, coin: "usd") {
  const storage = new UserStorage(context.background)

  return createQuerySchema<string, FixedInit, Error>(`totalPricedBalance/${context.user.uuid}/${coin}`, undefined, { storage })
}

export function useTotalPricedBalance(coin: "usd") {
  const context = useGeneralContext()
  const query = useQuery(getTotalPricedBalance, [context, coin])
  useSync(query)
  useFetch(query)
  useError(query, console.error)
  useFallback(query, new Data(new Fixed(0n, 0)))
  return query
}

export function getTotalWalletPricedBalance(context: GeneralContext, address: string, coin: "usd") {
  const storage = new UserStorage(context.background)

  return createQuerySchema<string, FixedInit, Error>(`totalPricedBalance/${address}/${coin}`, undefined, { storage })
}

export function useTotalWalletPricedBalance(address: string, coin: "usd") {
  const context = useGeneralContext()
  const query = useQuery(getTotalWalletPricedBalance, [context, address, coin])
  useSync(query)
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getPricedBalance(ethereum: EthereumContext, address: string, coin: "usd") {
  const storage = new UserStorage(ethereum.background)

  return createQuerySchema<string, FixedInit, Error>(`pricedBalance/${address}/${ethereum.chain.chainId}/${coin}`, undefined, { storage })
}

export function usePricedBalance(ethereum: EthereumContext, address: string, coin: "usd") {
  const query = useQuery(getPricedBalance, [ethereum, address, coin])
  useSync(query)
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getPendingBalance(address: string, ethereum: EthereumContext) {
  const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await tryFetch<FixedInit>(request, ethereum)

  const storage = new UserStorage(ethereum.background)

  return createQuerySchema<EthereumQueryKey<unknown>, FixedInit, Error>({
    version: 2,
    chainId: ethereum.chain.chainId,
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher, { storage })
}

export function usePendingBalance(address: string, ethereum: EthereumContext) {
  const query = useQuery(getPendingBalance, [address, ethereum])
  useSync(query)
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getNonceSchema(address: string, ethereum: EthereumContext) {
  const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await tryFetch<string>(request, ethereum).then(r => r.mapSync(r => r.mapSync(BigInt)))

  const storage = new UserStorage(ethereum.background)

  return createQuerySchema<EthereumQueryKey<unknown>, bigint, Error>({
    chainId: ethereum.chain.chainId,
    method: "eth_getTransactionCount",
    params: [address, "pending"]
  }, fetcher, { storage, dataSerializer: BigInts })
}

export function useNonce(address: string, ethereum: EthereumContext) {
  const query = useQuery(getNonceSchema, [address, ethereum])
  useFetch(query)
  useSync(query)
  useError(query, console.error)
  return query
}

export function getGasPriceSchema(ethereum: EthereumContext) {
  const fetcher = async (request: RpcRequestPreinit<unknown>) =>
    await tryFetch<string>(request, ethereum).then(r => r.mapSync(r => r.mapSync(BigInt)))

  const storage = new UserStorage(ethereum.background)

  return createQuerySchema<EthereumQueryKey<unknown>, bigint, Error>({
    chainId: ethereum.chain.chainId,
    method: "eth_gasPrice",
    params: []
  }, fetcher, { storage, dataSerializer: BigInts })
}

export function useGasPrice(ethereum: EthereumContext) {
  const query = useQuery(getGasPriceSchema, [ethereum])
  useFetch(query)
  useSync(query)
  useError(query, console.error)
  return query
}

export function getPairPrice(address: string, ethereum: EthereumContext) {
  const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await tryFetch<FixedInit>(request, ethereum)

  const storage = new UserStorage(ethereum.background)

  return createQuerySchema<EthereumQueryKey<unknown>, FixedInit, Error>({
    version: 2,
    chainId: ethereum.chain.chainId,
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher, { storage })
}