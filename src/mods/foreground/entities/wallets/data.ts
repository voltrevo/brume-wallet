import PairAbi from "@/assets/Pair.json"
import { BigInts, Fixed } from "@/libs/bigints/bigints"
import { EthereumChain, PairInfo, tokensByAddress } from "@/libs/ethereum/chain"
import { RpcRequestPreinit } from "@/libs/rpc"
import { Mutators } from "@/libs/xswr/mutators"
import { Optional, Some } from "@hazae41/option"
import { Ok, Result } from "@hazae41/result"
import { Core, Data, FetchError, Fetched, FetcherMore, NormalizerMore, Query, createQuerySchema, useCore, useError, useFetch, useOnce, useQuery } from "@hazae41/xswr"
import { Contract, ContractRunner, TransactionRequest, TransactionResponse } from "ethers"
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

export function getTotalBalance(address: string) {
  return createQuerySchema<string, Fixed, Error>(`totalBalance/${address}`, undefined)
}

export function getBalanceByToken(address: string) {
  const normalizer = async (fetched: Optional<Fetched<Record<string, Fixed>, Error>>, more: NormalizerMore) =>
    await fetched?.map(async index => {
      console.log(index)
      const total = Object.values(index).reduce((x, y) => y.add(x), new Fixed(0n, 0))
      console.log(total)
      const totalBalance = await getTotalBalance(address).make(more.core)
      await totalBalance.mutate(Mutators.data(total))
      return index
    })

  return createQuerySchema<string, Record<string, Fixed>, Error>(`balanceByToken/${address}`, undefined, { normalizer })
}

export function getBalance(address: string, ethereum: EthereumHandle) {
  const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await tryFetch<string>(request, ethereum).then(r => r.mapSync(r => r.mapSync(BigInt)))

  const normalizer = async (fetched: Optional<Fetched<bigint, Error>>, more: NormalizerMore) => {
    return fetched?.map(async balance => {
      const key = `${ethereum.chain.chainId}`
      const value = new Fixed(balance, 18)
      const balanceByToken = await getBalanceByToken(address).make(more.core)
      await balanceByToken.mutate(Mutators.mapData((d = new Data({})) => d.mapSync(p => ({ ...p, [key]: value }))))
      return balance
    })
  }

  const storage = new UserStorage(ethereum.background)

  return createQuerySchema<EthereumQueryKey<unknown>, bigint, Error>({
    chainId: ethereum.chain.chainId,
    method: "eth_getBalance",
    params: [address, "pending"]
  }, fetcher, { storage, dataSerializer: BigInts, normalizer })
}

export function useBalance(address: string, ethereum: EthereumHandle) {
  const query = useQuery(getBalance, [address, ethereum])
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

export function getPairReserves(core: Core, pair: PairInfo, ethereum: EthereumHandle) {
  const fetcher = async () => new Ok(new Data(await new Contract(pair.address, PairAbi, new BrumeProvider(ethereum)).getReserves()))

  const normalizer = async (fetched: Optional<Fetched<[bigint, bigint, bigint], Error>>) => {
    const priceQuery = await getPairPrice(pair).make(core)
    await priceQuery.mutate(() => new Some(computePairPrice(pair, fetched)))
    return fetched
  }

  return createQuerySchema<string, [bigint, bigint, bigint], Error>(`pair/${pair.address}/reserves`, fetcher, { normalizer })
}

export function usePairReserves(pair: PairInfo, ethereum: EthereumHandle) {
  const core = useCore().unwrap()
  const query = useQuery(getPairReserves, [core, pair, ethereum])
  useFetch(query)
  useSync(query)
  useError(query, console.error)
  return query
}

export function usePairPrice(pair: PairInfo, ethereum: EthereumHandle) {
  const reserves = usePairReserves(pair, ethereum)
  useFetch(reserves)
  useSync(reserves)
  useError(reserves, console.error)

  const price = useQuery(getPairPrice, [pair])
  useFetch(price)
  useSync(price)
  useError(price, console.error)

  return price
}

export function computePairPrice(pair: PairInfo, reserves: Optional<Fetched<[bigint, bigint, bigint], Error>>) {
  return reserves?.mapSync(reserves => {
    const decimals0 = tokensByAddress[pair.token0].decimals
    const decimals1 = tokensByAddress[pair.token1].decimals

    const [reserve0, reserve1] = reserves

    const quantity0 = new Fixed(reserve0, decimals0)
    const quantity1 = new Fixed(reserve1, decimals1)

    return quantity1.div(quantity0)
  })
}

export function getPairPrice(pair: PairInfo) {
  return createQuerySchema<string, Fixed, Error>(`pair/${pair.address}/price`, undefined)
}
