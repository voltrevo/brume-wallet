import { BigInts } from "@/libs/bigints/bigints"
import { EthereumChain } from "@/libs/ethereum/chain"
import { RpcRequestPreinit } from "@/libs/rpc"
import { Optional, Some } from "@hazae41/option"
import { Result } from "@hazae41/result"
import { FetchError, Fetched, FetcherMore, Query, createQuerySchema, useCore, useError, useFetch, useOnce, useQuery } from "@hazae41/xswr"
import { useCallback, useEffect } from "react"
import { Background, UserStorage } from "../../background/background"
import { useBackground } from "../../background/context"

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

export type EthereumQueryKey<T = unknown> = RpcRequestPreinit<T> & {
  chainId: number
}

export interface EthereumHandle {
  wallet: Wallet,
  chain: EthereumChain,
  background: Background
}

export interface EthereumHandleProps {
  handle: EthereumHandle
}

export function useEthereumHandle(wallet: Wallet, chain: EthereumChain): EthereumHandle {
  const background = useBackground()
  return { wallet, chain, background }
}

export async function tryFetch<T>(request: RpcRequestPreinit<unknown>, ethereum: EthereumHandle): Promise<Result<Fetched<T, Error>, FetchError>> {
  const { background, wallet, chain } = ethereum

  return await background.tryRequest<T>({
    method: "brume_call_ethereum",
    params: [wallet.uuid, chain.id, request]
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
    await core.update(cacheKey, () => new Some(unstored), query)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [core, cacheKey])

  useEffect(() => {
    sync()
  }, [sync])
}

export function getBalanceSchema(address: string, ethereum: EthereumHandle) {
  const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await tryFetch<string>(request, ethereum).then(r => r.mapSync(r => r.mapSync(BigInt)))

  const storage = new UserStorage(ethereum.background)

  return createQuerySchema<EthereumQueryKey<unknown>, bigint, Error>({
    chainId: ethereum.chain.id,
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher, { storage, dataSerializer: BigInts })
}

export function useBalance(address: string, ethereum: EthereumHandle) {
  const query = useQuery(getBalanceSchema, [address, ethereum])
  useSync(query)
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getNonceSchema(address: string, ethereum: EthereumHandle) {
  const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await tryFetch<string>(request, ethereum).then(r => r.mapSync(r => r.mapSync(BigInt)))

  const storage = new UserStorage(ethereum.background)

  return createQuerySchema<EthereumQueryKey<unknown>, bigint, Error>({
    chainId: ethereum.chain.id,
    method: "eth_getTransactionCount",
    params: [address, "pending"]
  }, fetcher, { storage, dataSerializer: BigInts })
}

export function useNonce(address: string, ethereum: EthereumHandle) {
  const query = useQuery(getNonceSchema, [address, ethereum])
  useFetch(query)
  useSync(query)
  useError(query, console.error)
  return query
}

export function getGasPriceSchema(ethereum: EthereumHandle) {
  const fetcher = async (request: RpcRequestPreinit<unknown>) =>
    await tryFetch<string>(request, ethereum).then(r => r.mapSync(r => r.mapSync(BigInt)))

  const storage = new UserStorage(ethereum.background)

  return createQuerySchema<EthereumQueryKey<unknown>, bigint, Error>({
    chainId: ethereum.chain.id,
    method: "eth_gasPrice",
    params: []
  }, fetcher, { storage, dataSerializer: BigInts })
}

export function useGasPrice(ethereum: EthereumHandle) {
  const query = useQuery(getGasPriceSchema, [ethereum])
  useFetch(query)
  useSync(query)
  useError(query, console.error)
  return query
}