import { BigInts } from "@/libs/bigints/bigints"
import { EthereumChain } from "@/libs/ethereum/chain"
import { RpcRequestPreinit } from "@/libs/rpc"
import { Optional } from "@hazae41/option"
import { Result } from "@hazae41/result"
import { FetchError, Fetched, FetcherMore, createQuerySchema, useError, useFetch, useOnce, useQuery } from "@hazae41/xswr"
import { Background, BackgroundStorage } from "../../background/background"
import { useBackground } from "../../background/context"
import { useCurrentUser } from "../users/context"
import { User } from "../users/data"

export type Wallet =
  | WalletRef
  | WalletData

export interface WalletProps {
  wallet: Wallet
}

export interface WalletDataProps {
  wallet: WalletData
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

export type EthereumQueryKey<T> = RpcRequestPreinit<T> & {
  chainId: number
}

export interface EthereumHandle {
  uuid: string,
  user: User,
  chain: EthereumChain,
  background: Background
}

export interface EthereumHandleProps {
  handle: EthereumHandle
}

export function useEthereumHandle(uuid: string, chain: EthereumChain): EthereumHandle {
  const user = useCurrentUser()
  const background = useBackground()
  return { user, uuid, chain, background }
}

export async function tryFetch<T>(key: EthereumQueryKey<unknown>, ethereum: EthereumHandle): Promise<Result<Fetched<T, Error>, FetchError>> {
  const { background, uuid } = ethereum

  return await background.tryRequest<T>({
    method: "brume_fetch",
    params: [uuid, JSON.stringify(key)]
  }).then(r => r.mapSync(x => Fetched.rewrap(x)).mapErrSync(FetchError.from))
}

export function getBalanceSchema(address: string, ethereum: EthereumHandle) {
  const fetcher = async (init: EthereumQueryKey<unknown>, more: FetcherMore = {}) =>
    await tryFetch<string>(init, ethereum).then(r => r.mapSync(r => r.mapSync(BigInt)))

  const storage = new BackgroundStorage(ethereum.background)

  return createQuerySchema<EthereumQueryKey<unknown>, bigint, Error>({
    chainId: ethereum.chain.id,
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher, { storage, dataSerializer: BigInts })
}

export function useBalance(address: string, ethereum: EthereumHandle) {
  const query = useQuery(getBalanceSchema, [address, ethereum])
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getNonceSchema(address: string, ethereum: EthereumHandle) {
  const fetcher = async (init: EthereumQueryKey<unknown>, more: FetcherMore = {}) =>
    await tryFetch<string>(init, ethereum).then(r => r.mapSync(r => r.mapSync(BigInt)))

  const storage = new BackgroundStorage(ethereum.background)

  return createQuerySchema<EthereumQueryKey<unknown>, bigint, Error>({
    chainId: ethereum.chain.id,
    method: "eth_getTransactionCount",
    params: [address, "pending"]
  }, fetcher, { storage, dataSerializer: BigInts })
}

export function useNonce(address: string, ethereum: EthereumHandle) {
  const query = useQuery(getNonceSchema, [address, ethereum])
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getGasPriceSchema(ethereum: EthereumHandle) {
  const fetcher = async (init: EthereumQueryKey<unknown>, more: FetcherMore = {}) =>
    await tryFetch<string>(init, ethereum).then(r => r.mapSync(r => r.mapSync(BigInt)))

  const storage = new BackgroundStorage(ethereum.background)

  return createQuerySchema<EthereumQueryKey<unknown>, bigint, Error>({
    chainId: ethereum.chain.id,
    method: "eth_gasPrice",
    params: []
  }, fetcher, { storage, dataSerializer: BigInts })
}

export function useGasPrice(ethereum: EthereumHandle) {
  const query = useQuery(getGasPriceSchema, [ethereum])
  useFetch(query)
  useError(query, console.error)
  return query
}