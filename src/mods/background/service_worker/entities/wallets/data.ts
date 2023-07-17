import PairAbi from "@/assets/Pair.json"
import { Fixed, FixedInit } from "@/libs/bigints/bigints"
import { Port } from "@/libs/channel/channel"
import { EthereumChain, PairInfo, chains, pairsByAddress, tokensByAddress } from "@/libs/ethereum/chain"
import { RpcRequestPreinit, RpcResponse } from "@/libs/rpc"
import { AbortSignals } from "@/libs/signals/signals"
import { Mutators } from "@/libs/xswr/mutators"
import { Arrays } from "@hazae41/arrays"
import { None, Option, Some } from "@hazae41/option"
import { Cancel, Looped, Retry, tryLoop } from "@hazae41/piscine"
import { Ok, Result } from "@hazae41/result"
import { Data, FetchError, Fetched, FetcherMore, IDBStorage, IndexerMore, NormalizerMore, States, createQuerySchema } from "@hazae41/xswr"
import { Contract, ContractRunner, TransactionRequest } from "ethers"
import { EthereumBrumes } from "../brumes/data"
import { SessionData } from "../sessions/data"
import { User } from "../users/data"

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

export type WalletData =
  | EthereumReadonlyWallet
  | EthereumPrivateKeyWallet
  | EthereumAuthPrivateKeyWallet

export type EthereumWalletData =
  | EthereumReadonlyWallet
  | EthereumPrivateKeyWallet
  | EthereumAuthPrivateKeyWallet

export type EthereumSignableWalletData =
  | EthereumPrivateKeyWallet
  | EthereumAuthPrivateKeyWallet

export interface EthereumReadonlyWallet {
  readonly coin: "ethereum"
  readonly type: "readonly"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: string
}

export interface EthereumPrivateKeyWallet {
  readonly coin: "ethereum"
  readonly type: "privateKey"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: string

  readonly privateKey: string
}

export interface EthereumAuthPrivateKeyWallet {
  readonly coin: "ethereum"
  readonly type: "authPrivateKey"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: string

  readonly privateKey: {
    readonly ivBase64: string,
    readonly idBase64: string
  }
}

export interface BitcoinPrivateKeyWallet {
  readonly coin: "bitcoin"
  readonly type: "privateKey"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly privateKey: string
  readonly compressedAddress: string
  readonly uncompressedAddress: string
}

export function getWallet(uuid: string, storage: IDBStorage) {
  return createQuerySchema<string, WalletData, never>({ key: `wallet/${uuid}`, storage })
}

export async function getWalletRef(wallet: Wallet, storage: IDBStorage, more: NormalizerMore): Promise<WalletRef> {
  if ("ref" in wallet) return wallet

  const schema = getWallet(wallet.uuid, storage)
  await schema?.normalize(new Data(wallet), more)

  return { ref: true, uuid: wallet.uuid }
}

export type EthereumQueryKey<T> = RpcRequestPreinit<T> & {
  version?: number
  chainId?: number
}

export interface EthereumContext {
  user: User,
  port: Port
  wallet: Wallet
  chain: EthereumChain
  brumes: EthereumBrumes
  session?: SessionData
}

export async function tryEthereumFetch<T>(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, more: FetcherMore = {}) {
  const { signal = AbortSignals.timeout(30_000) } = more

  const openBrumes = [...ethereum.brumes.inner]

  return await tryLoop(async () => {
    return await Result.unthrow<Result<Fetched<T, Error>, Looped<Error>>>(async t => {
      const brume = Arrays.takeCryptoRandom(openBrumes).result.get()
      const sockets = Option.wrap(brume.sockets[ethereum.chain.chainId]).ok().mapErrSync(Cancel.new).throw(t)

      console.log(`Fetching ${request.method} with`, brume.circuit.id)

      const openSockets = [...sockets]

      const response = await tryLoop(async (i) => {
        return await Result.unthrow<Result<RpcResponse<T>, Looped<Error>>>(async t => {
          const socket = Arrays.takeCryptoRandom(openSockets).result.get()
          const response = await brume.client.tryFetchWithSocket<T>(socket, request, signal).then(r => r.mapErrSync(Retry.new).throw(t))

          return new Ok(response)
        })
      }, { base: 1, max: openSockets.length }).then(r => r.mapErrSync(Retry.new).throw(t))

      return new Ok(Fetched.rewrap(response))
    })
  }, { base: 1, max: openBrumes.length }).then(r => r.mapErrSync(FetchError.from))
}

export function getEthereumUnknown(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
  const fetcher = async (request: RpcRequestPreinit<unknown>) =>
    await tryEthereumFetch<unknown>(ethereum, request)

  return createQuerySchema<EthereumQueryKey<unknown>, any, Error>({
    key: {
      chainId: ethereum.chain.chainId,
      method: request.method,
      params: request.params
    },
    fetcher,
    storage
  })
}

export function getTotalPricedBalance(user: User, coin: "usd", storage: IDBStorage) {
  return createQuerySchema<string, FixedInit, Error>({
    key: `totalPricedBalance/${user.uuid}/${coin}`,
    storage
  })
}

export function getTotalPricedBalanceByWallet(user: User, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<Record<string, FixedInit>, Error>, more: IndexerMore) => {
    const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr({})
    const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

    const totalBalance = await getTotalPricedBalance(user, coin, storage).make(more.core)
    await totalBalance.mutate(Mutators.data<FixedInit, Error>(total))
  }

  return createQuerySchema<string, Record<string, FixedInit>, Error>({
    key: `totalPricedBalanceByWallet/${user.uuid}/${coin}`,
    indexer,
    storage
  })
}

export function getTotalWalletPricedBalance(user: User, address: string, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<FixedInit, Error>, more: IndexerMore) => {
    const value = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr(new Fixed(0n, 0))

    const indexQuery = await getTotalPricedBalanceByWallet(user, coin, storage).make(more.core)
    await indexQuery.mutate(Mutators.mapInnerData(p => ({ ...p, [address]: value }), new Data({})))
  }

  return createQuerySchema<string, FixedInit, Error>({
    key: `totalPricedBalance/${address}/${coin}`,
    indexer,
    storage
  })
}

export function getPricedBalanceByToken(user: User, address: string, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<Record<string, FixedInit>, Error>, more: IndexerMore) => {
    const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr({})
    const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

    const totalBalance = await getTotalWalletPricedBalance(user, address, coin, storage).make(more.core)
    await totalBalance.mutate(Mutators.data<FixedInit, Error>(total))
  }

  return createQuerySchema<string, Record<string, FixedInit>, Error>({
    key: `pricedBalanceByToken/${address}/${coin}`,
    indexer,
    storage
  })
}

export function getPricedEthereumBalance(ethereum: EthereumContext, address: string, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<FixedInit, Error>, more: IndexerMore) => {
    const value = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr(new Fixed(0n, 0))

    const indexQuery = await getPricedBalanceByToken(ethereum.user, address, coin, storage).make(more.core)
    await indexQuery.mutate(Mutators.mapInnerData(p => ({ ...p, [ethereum.chain.chainId]: value }), new Data({})))
  }

  return createQuerySchema<string, FixedInit, Error>({
    key: `pricedBalance/${address}/${ethereum.chain.chainId}/${coin}`,
    indexer,
    storage
  })
}

export function getEthereumBalance(ethereum: EthereumContext, address: string, block: string, storage: IDBStorage) {
  const fetcher = async (request: RpcRequestPreinit<unknown>) =>
    await tryEthereumFetch<string>(ethereum, request).then(r => r.mapSync(d => d.mapSync(x => new FixedInit(x, ethereum.chain.token.decimals))))

  const indexer = async (states: States<FixedInit, Error>, more: IndexerMore) => {
    if (block !== "pending")
      return

    const pricedBalance = await Option.wrap(states.current.real?.data?.get()).andThen(async balance => {
      if (ethereum.chain.token.pairs == null)
        return new None()

      let pricedBalance: Fixed = Fixed.from(balance)

      for (const pairAddress of ethereum.chain.token.pairs) {
        const pair = pairsByAddress[pairAddress]
        const chain = chains[pair.chainId]

        const price = await getPairPrice({ ...ethereum, chain }, pair, storage).make(more.core)

        if (price.data == null)
          return new None()

        pricedBalance = pricedBalance.mul(Fixed.from(price.data.inner))
      }

      return new Some(pricedBalance)
    }).then(o => o.unwrapOr(new Fixed(0n, 0)))

    const pricedBalanceQuery = await getPricedEthereumBalance(ethereum, address, "usd", storage).make(more.core)
    await pricedBalanceQuery.mutate(Mutators.set(new Data(pricedBalance)))
  }

  return createQuerySchema<EthereumQueryKey<unknown>, FixedInit, Error>({
    key: {
      version: 2,
      chainId: ethereum.chain.chainId,
      method: "eth_getBalance",
      params: [address, block]
    },
    fetcher,
    indexer,
    storage
  })
}

export class BrumeProvider implements ContractRunner {
  provider = null

  constructor(
    readonly ethereum: EthereumContext
  ) { }

  async call(tx: TransactionRequest) {
    return await tryEthereumFetch<string>(this.ethereum, {
      method: "eth_call",
      params: [{
        to: tx.to,
        data: tx.data
      }, "pending"]
    }).then(r => r.unwrap().unwrap())
  }

}

export function getPairPrice(ethereum: EthereumContext, pair: PairInfo, storage: IDBStorage) {
  const fetcher = async () => {
    const provider = new BrumeProvider(ethereum)
    const contract = new Contract(pair.address, PairAbi, provider)
    const reserves = await contract.getReserves()
    const price = computePairPrice(pair, reserves)

    return new Ok(new Data(price))
  }

  return createQuerySchema<string, FixedInit, Error>({
    key: `pairs/${pair.address}/price`,
    fetcher,
    storage
  })
}

export function computePairPrice(pair: PairInfo, reserves: [bigint, bigint]) {
  const decimals0 = tokensByAddress[pair.token0].decimals
  const decimals1 = tokensByAddress[pair.token1].decimals

  const [reserve0, reserve1] = reserves

  const quantity0 = new Fixed(reserve0, decimals0)
  const quantity1 = new Fixed(reserve1, decimals1)

  return quantity1.div(quantity0)
}