import PairAbi from "@/assets/Pair.json"
import { BigInts, Fixed } from "@/libs/bigints/bigints"
import { EthereumChain, PairInfo, tokensByAddress } from "@/libs/ethereum/chain"
import { RpcRequestPreinit } from "@/libs/rpc"
import { Optional, Some } from "@hazae41/option"
import { Ok, Result } from "@hazae41/result"
import { Data, FetchError, Fetched, FetcherMore, Query, createQuerySchema, useCore, useError, useFetch, useOnce, useQuery } from "@hazae41/xswr"
import { Contract, ContractRunner, TransactionRequest, TransactionResponse } from "ethers"
import { useCallback, useEffect, useMemo } from "react"
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
    chainId: ethereum.chain.chainId,
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
    chainId: ethereum.chain.chainId,
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
    chainId: ethereum.chain.chainId,
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

export class BrumeProvider implements ContractRunner {
  provider = null

  constructor(
    readonly ethereum: EthereumHandle
  ) { }

  async call(tx: TransactionRequest) {
    return await tryFetch<string>({
      method: "eth_call",
      params: [{
        to: tx.to,
        data: tx.data
      }, "pending"]
    }, this.ethereum).then(r => r.unwrap().unwrap())
  }

  estimateGas?: ((tx: TransactionRequest) => Promise<bigint>) | undefined
  resolveName?: ((name: string) => Promise<string | null>) | undefined
  sendTransaction?: ((tx: TransactionRequest) => Promise<TransactionResponse>) | undefined
}

export function getPairReserves(address: string, ethereum: EthereumHandle) {
  const fetcher = async () => new Ok(new Data(await new Contract(address, PairAbi, new BrumeProvider(ethereum)).getReserves()))

  return createQuerySchema<string, [bigint, bigint, bigint], Error>(`pair_price/${address}`, fetcher)
}

export function usePairReserves(address: string, ethereum: EthereumHandle) {
  const query = useQuery(getPairReserves, [address, ethereum])
  useFetch(query)
  useSync(query)
  useError(query, console.error)
  return query
}

export function usePairPrice(pair: PairInfo, ethereum: EthereumHandle) {
  const reserves = usePairReserves(pair.address, ethereum)

  return useMemo(() => {
    if (reserves.current === undefined)
      return undefined
    if (reserves.current.isErr())
      return reserves.current

    const decimals0 = tokensByAddress[pair.token0].decimals
    const decimals1 = tokensByAddress[pair.token1].decimals

    const [reserve0, reserve1] = reserves.current.inner

    const quantity0 = new Fixed(reserve0, decimals0)
    const quantity1 = new Fixed(reserve1, decimals1)

    const price = quantity1.div(quantity0)

    return new Ok(price)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair, reserves.current])
}