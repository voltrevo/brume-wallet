import PairAbi from "@/assets/Pair.json"
import { BigInts, Fixed } from "@/libs/bigints/bigints"
import { EthereumChain, PairInfo, pairsByAddress, tokensByAddress } from "@/libs/ethereum/chain"
import { RpcRequestPreinit } from "@/libs/rpc"
import { Mutators } from "@/libs/xswr/mutators"
import { Optional } from "@hazae41/option"
import { Ok, Result } from "@hazae41/result"
import { Data, FetchError, Fetched, FetcherMore, NormalizerMore, Query, createQuerySchema, useCore, useError, useFallback, useFetch, useOnce, useQuery } from "@hazae41/xswr"
import { Contract, ContractRunner, TransactionRequest, TransactionResponse } from "ethers"
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

export type EthereumQueryKey<T = unknown> = RpcRequestPreinit<T> & {
  chainId: number
}

export interface EthereumHandle {
  user: User,
  wallet: Wallet,
  chain: EthereumChain,
  background: Background
}

export interface EthereumHandleProps {
  handle: EthereumHandle
}

export function useEthereumHandle(wallet: Wallet, chain: EthereumChain): EthereumHandle {
  const user = useCurrentUser()
  const background = useBackground()
  return { user, wallet, chain, background }
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

export function getTotalPricedBalance(user: User) {
  return createQuerySchema<string, Fixed, Error>(`totalPricedBalance/${user.uuid}`, undefined)
}

export function useTotalPricedBalance() {
  const user = useCurrentUser()
  const query = useQuery(getTotalPricedBalance, [user])
  useFallback(query, new Data(new Fixed(0n, 0)))
  return query
}

export function getTotalPricedBalanceByWallet(user: User) {
  const normalizer = async (fetched: Optional<Fetched<Record<string, Fixed>, Error>>, more: NormalizerMore) =>
    await fetched?.map(async index => {
      const total = Object.values(index).reduce((x, y) => y.add(x), new Fixed(0n, 0))

      const totalBalance = await getTotalPricedBalance(user).make(more.core)
      await totalBalance.mutate(Mutators.data(total))

      return index
    })

  return createQuerySchema<string, Record<string, Fixed>, Error>(`totalPricedBalanceByWallet/${user.uuid}`, undefined, { normalizer })
}

export function getTotalWalletPricedBalance(address: string, user: User) {
  const normalizer = async (fetched: Optional<Fetched<Fixed, Error>>, more: NormalizerMore) =>
    await fetched?.map(async totalWalletPricedBalance => {
      const key = address
      const value = totalWalletPricedBalance

      const indexQuery = await getTotalPricedBalanceByWallet(user).make(more.core)
      await indexQuery.mutate(Mutators.mapInnerDataOr(p => ({ ...p, [key]: value }), new Data({})))

      return totalWalletPricedBalance
    })

  return createQuerySchema<string, Fixed, Error>(`totalPricedBalance/${address}`, undefined, { normalizer })
}

export function useTotalWalletPricedBalance(address: string) {
  const user = useCurrentUser()
  const query = useQuery(getTotalWalletPricedBalance, [address, user])
  return query
}

export function getPricedBalanceByToken(address: string, user: User) {
  const normalizer = async (fetched: Optional<Fetched<Record<string, Fixed>, Error>>, more: NormalizerMore) =>
    await fetched?.map(async index => {
      const total = Object.values(index).reduce((x, y) => y.add(x), new Fixed(0n, 0))

      const totalBalance = await getTotalWalletPricedBalance(address, user).make(more.core)
      await totalBalance.mutate(Mutators.data(total))

      return index
    })

  return createQuerySchema<string, Record<string, Fixed>, Error>(`pricedBalanceByToken/${address}`, undefined, { normalizer })
}

export function getPricedBalance(address: string, ethereum: EthereumHandle) {
  const normalizer = async (fetched: Optional<Fetched<Fixed, Error>>, more: NormalizerMore) =>
    await fetched?.map(async pricedBalance => {
      const key = ethereum.chain.chainId
      const value = pricedBalance

      const indexQuery = await getPricedBalanceByToken(address, ethereum.user).make(more.core)
      await indexQuery.mutate(Mutators.mapInnerDataOr(p => ({ ...p, [key]: value }), new Data({})))

      return pricedBalance
    })

  return createQuerySchema<string, Fixed, Error>(`pricedBalance/${address}/${ethereum.chain.chainId}`, undefined, { normalizer })
}

export function usePricedBalance(address: string, ethereum: EthereumHandle) {
  const query = useQuery(getPricedBalance, [address, ethereum])
  useSync(query)
  useFetch(query)
  useError(query, console.error)
  return query
}

export function getBalance(address: string, ethereum: EthereumHandle) {
  const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) =>
    await tryFetch<string>(request, ethereum).then(r => r.mapSync(r => r.mapSync(BigInt)))

  const normalizer = async (fetched: Optional<Fetched<bigint, Error>>, more: NormalizerMore) =>
    await fetched?.map(async balance => {
      let current: Fixed = new Fixed(BigInt(balance), 18)

      if (ethereum.chain.token.pairs === undefined)
        return balance

      for (const pair of ethereum.chain.token.pairs) {
        const price = await getPairPrice(pairsByAddress[pair], ethereum).make(more.core)

        if (price.data === undefined)
          return balance

        current = current.mul(price.data.inner)
      }

      const pricedBalanceQuery = await getPricedBalance(address, ethereum).make(more.core)
      await pricedBalanceQuery.mutate(Mutators.set(new Data(current)))

      return balance
    })


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

export function getPairPrice(pair: PairInfo, ethereum: EthereumHandle) {
  const fetcher = async () => {
    const provider = new BrumeProvider(ethereum)
    const contract = new Contract(pair.address, PairAbi, provider)
    const reserves = await contract.getReserves()
    const price = computePairPrice(pair, reserves)

    return new Ok(new Data(price))
  }

  return createQuerySchema<string, Fixed, Error>(`pair/${pair.address}/reserves`, fetcher)
}

export function computePairPrice(pair: PairInfo, reserves: [bigint, bigint]) {
  const decimals0 = tokensByAddress[pair.token0].decimals
  const decimals1 = tokensByAddress[pair.token1].decimals

  const [reserve0, reserve1] = reserves

  const quantity0 = new Fixed(reserve0, decimals0)
  const quantity1 = new Fixed(reserve1, decimals1)

  return quantity1.div(quantity0)
}

export function usePairPrice(pair: PairInfo, ethereum: EthereumHandle) {
  const price = useQuery(getPairPrice, [pair, ethereum])
  useFetch(price)
  useSync(price)
  useError(price, console.error)

  return price
}