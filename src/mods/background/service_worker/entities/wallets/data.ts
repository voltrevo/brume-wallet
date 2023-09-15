import Erc20Abi from "@/assets/Erc20.json"
import PairAbi from "@/assets/Pair.json"
import { Fixed, FixedInit } from "@/libs/bigints/bigints"
import { ContractTokenInfo, EthereumChain, PairInfo, chainByChainId, pairByAddress, tokenByAddress } from "@/libs/ethereum/mods/chain"
import { RpcRequestPreinit, RpcResponse, TorRpc } from "@/libs/rpc"
import { AbortSignals } from "@/libs/signals/signals"
import { Mutators } from "@/libs/xswr/mutators"
import { None, Option, Some } from "@hazae41/option"
import { Cancel, Looped, Retry, tryLoop } from "@hazae41/piscine"
import { Err, Ok, Panic, Result } from "@hazae41/result"
import { Data, FetchError, Fetched, FetcherMore, IDBStorage, IndexerMore, States, createQuerySchema } from "@hazae41/xswr"
import { Contract, ContractRunner, TransactionRequest } from "ethers"
import { EthBrume, EthBrumes, RpcConnection } from "../brumes/data"
import { WalletsBySeed } from "../seeds/all/data"
import { SeedRef } from "../seeds/data"
import { SessionData } from "../sessions/data"
import { User } from "../users/data"
import { Wallets } from "./all/data"


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

export namespace WalletRef {

  export function from(wallet: Wallet): WalletRef {
    return { ref: true, uuid: wallet.uuid }
  }

}

export type WalletData =
  | EthereumWalletData

export type EthereumWalletData =
  | EthereumReadonlyWalletData
  | EthereumSignableWalletData

export type EthereumSignableWalletData =
  | EthereumPrivateKeyWalletData
  | EthereumSeededWalletData

export type EthereumPrivateKeyWalletData =
  | EthereumUnauthPrivateKeyWalletData
  | EthereumAuthPrivateKeyWalletData

export interface EthereumReadonlyWalletData {
  readonly coin: "ethereum"
  readonly type: "readonly"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: string
}

export interface EthereumUnauthPrivateKeyWalletData {
  readonly coin: "ethereum"
  readonly type: "privateKey"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: string

  readonly privateKey: string
}

export interface EthereumAuthPrivateKeyWalletData {
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

export interface EthereumSeededWalletData {
  readonly coin: "ethereum"
  readonly type: "seeded"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: string

  readonly seed: SeedRef
  readonly path: string
}

export namespace Wallet {

  export type Key = ReturnType<typeof key>

  export function key(uuid: string) {
    return `wallet/${uuid}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(uuid: string, storage: IDBStorage) {
    const indexer = async (states: States<WalletData, never>, more: IndexerMore) => {
      const { current, previous = current } = states
      const { core } = more

      const previousData = previous.real?.data
      const currentData = current.real?.data

      const walletsQuery = await Wallets.schema(storage).make(core)

      await walletsQuery.mutate(Mutators.mapData((d = new Data([])) => {
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid))
        if (currentData != null)
          d = d.mapSync(p => [...p, WalletRef.from(currentData.inner)])
        return d
      }))

      if (currentData?.inner.type === "seeded") {
        const { seed } = currentData.inner

        const walletsBySeedQuery = await WalletsBySeed.Background.schema(seed.uuid, storage).make(core)

        await walletsBySeedQuery.mutate(Mutators.mapData((d = new Data([])) => {
          if (previousData != null)
            d = d.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid))
          if (currentData != null)
            d = d.mapSync(p => [...p, WalletRef.from(currentData.inner)])
          return d
        }))
      }
    }

    return createQuerySchema<Key, WalletData, never>({ key: key(uuid), storage, indexer })
  }

}

export type EthereumQueryKey<T> = RpcRequestPreinit<T> & {
  version?: number
  chainId: number
}

export interface EthereumContext {
  user: User,
  wallet: Wallet
  chain: EthereumChain
  brumes: EthBrumes
  session?: SessionData
}

export async function tryEthereumFetch<T>(ethereum: EthereumContext, init: RpcRequestPreinit<unknown>, more: FetcherMore = {}) {
  const { signal = AbortSignals.timeout(30_000) } = more
  const brumes = ethereum.brumes.inner

  // console.log(`Fetching ${request.method}`)

  const allTriedBrumes = new Set<EthBrume>()

  const result = await tryLoop(async () => {
    return await Result.unthrow<Result<Fetched<T, Error>, Looped<Error>>>(async t => {
      let brume: EthBrume

      while (true) {
        brume = await brumes.tryGetCryptoRandom().then(r => r.mapErrSync(Cancel.new).throw(t).result.get().inner)

        if (allTriedBrumes.has(brume))
          continue
        allTriedBrumes.add(brume)
        break
      }

      const conns = Option.wrap(brume.chains[ethereum.chain.chainId]).ok().mapErrSync(Cancel.new).throw(t)

      // console.log(`Fetching ${request.method} using ${brume.circuit.id}`)

      const allTriedConns = new Set<RpcConnection>()

      const result = await tryLoop(async (i) => {
        return await Result.unthrow<Result<RpcResponse<T>, Looped<Error>>>(async t => {
          let conn: RpcConnection

          while (true) {
            conn = await conns.tryGetCryptoRandom().then(r => r.mapErrSync(Cancel.new).throw(t).result.get().inner)

            if (allTriedConns.has(conn))
              continue
            allTriedConns.add(conn)
            break
          }

          const { client, connection } = conn
          const request = client.prepare(init)

          if (connection.isURL()) {
            console.log(`Fetching ${init.method} from ${connection.url.href} using ${brume.circuit.id}`)

            const result = await TorRpc.tryFetchWithCircuit<T>(connection.url, { ...request, circuit: brume.circuit })

            if (result.isErr())
              console.warn(`Could not fetch ${init.method} from ${connection.url.href} using ${brume.circuit.id}`)

            return result.mapErrSync(Retry.new)
          }

          if (connection.isWebSocket()) {
            console.log(`Fetching ${init.method} from ${connection.socket.url} using ${brume.circuit.id}`)

            const result = await TorRpc.tryFetchWithSocket<T>(connection.socket, request, signal)

            if (result.isErr())
              console.warn(`Could not fetch ${init.method} from ${connection.socket.url} using ${brume.circuit.id}`)

            return result.mapErrSync(Retry.new)
          }

          connection satisfies never
          throw new Panic()
        })
      }, { base: 1, max: conns.capacity })

      if (result.isErr())
        console.warn(`Could not fetch ${init.method} using ${brume.circuit.id}`)

      return result
        .mapSync(x => Fetched.rewrap(x))
        .mapErrSync(Retry.new)
    })
  }, { base: 1, max: brumes.capacity })

  if (result.isErr())
    console.warn(`Could not fetch ${init.method}`)

  return result.mapErrSync(FetchError.from)
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

export function getTotalWalletPricedBalance(user: User, account: string, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<FixedInit, Error>, more: IndexerMore) => {
    const value = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr(new Fixed(0n, 0))

    const indexQuery = await getTotalPricedBalanceByWallet(user, coin, storage).make(more.core)
    await indexQuery.mutate(Mutators.mapInnerData(p => ({ ...p, [account]: value }), new Data({})))
  }

  return createQuerySchema<string, FixedInit, Error>({
    key: `totalWalletPricedBalance/${account}/${coin}`,
    indexer,
    storage
  })
}

export function getPricedBalanceByToken(user: User, account: string, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<Record<string, FixedInit>, Error>, more: IndexerMore) => {
    const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr({})
    const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

    const totalBalance = await getTotalWalletPricedBalance(user, account, coin, storage).make(more.core)
    await totalBalance.mutate(Mutators.data<FixedInit, Error>(total))
  }

  return createQuerySchema<string, Record<string, FixedInit>, Error>({
    key: `pricedBalanceByToken/${account}/${coin}`,
    indexer,
    storage
  })
}

export function getPricedBalance(ethereum: EthereumContext, account: string, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<FixedInit, Error>, more: IndexerMore) => {
    const key = `${ethereum.chain.chainId}`
    const value = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr(new Fixed(0n, 0))

    const indexQuery = await getPricedBalanceByToken(ethereum.user, account, coin, storage).make(more.core)
    await indexQuery.mutate(Mutators.mapInnerData(p => ({ ...p, [key]: value }), new Data({})))
  }

  return createQuerySchema<EthereumQueryKey<unknown>, FixedInit, Error>({
    key: {
      chainId: ethereum.chain.chainId,
      method: "eth_getPricedBalance",
      params: [account, coin]
    },
    indexer,
    storage
  })
}

export function getBalance(ethereum: EthereumContext, account: string, block: string, storage: IDBStorage) {
  const fetcher = async (request: RpcRequestPreinit<unknown>) => {
    return await tryEthereumFetch<string>(ethereum, request).then(r => r.mapSync(d => d.mapSync(x => new FixedInit(x, ethereum.chain.token.decimals)))).then(r => {
      console.log("<-", ethereum.chain.chainId, r)
      return r
    })
  }

  const indexer = async (states: States<FixedInit, Error>, more: IndexerMore) => {
    if (block !== "pending")
      return

    const pricedBalance = await Option.wrap(states.current.real?.data?.get()).andThen(async balance => {
      if (ethereum.chain.token.pairs == null)
        return new None()

      let pricedBalance: Fixed = Fixed.from(balance)

      for (const pairAddress of ethereum.chain.token.pairs) {
        const pair = pairByAddress[pairAddress]
        const chain = chainByChainId[pair.chainId]

        const price = await getPairPrice({ ...ethereum, chain }, pair, storage).make(more.core)

        if (price.data == null)
          return new None()

        pricedBalance = pricedBalance.mul(Fixed.from(price.data.inner))
      }

      return new Some(pricedBalance)
    }).then(o => o.unwrapOr(new Fixed(0n, 0)))

    const pricedBalanceQuery = await getPricedBalance(ethereum, account, "usd", storage).make(more.core)
    await pricedBalanceQuery.mutate(Mutators.set(new Data(pricedBalance)))
  }

  return createQuerySchema<EthereumQueryKey<unknown>, FixedInit, Error>({
    key: {
      version: 2,
      chainId: ethereum.chain.chainId,
      method: "eth_getBalance",
      params: [account, block]
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
    try {
      const provider = new BrumeProvider(ethereum)
      const contract = new Contract(pair.address, PairAbi, provider)
      const reserves = await contract.getReserves()
      const price = computePairPrice(pair, reserves)

      return new Ok(new Data(price))
    } catch (e: unknown) {
      return new Err(FetchError.from(e))
    }
  }

  return createQuerySchema<EthereumQueryKey<unknown>, FixedInit, Error>({
    key: {
      chainId: ethereum.chain.chainId,
      method: "eth_getPairPrice",
      params: [pair.address]
    },
    fetcher,
    storage
  })
}

export function computePairPrice(pair: PairInfo, reserves: [bigint, bigint]) {
  const decimals0 = tokenByAddress[pair.token0].decimals
  const decimals1 = tokenByAddress[pair.token1].decimals

  const [reserve0, reserve1] = reserves

  const quantity0 = new Fixed(reserve0, decimals0)
  const quantity1 = new Fixed(reserve1, decimals1)

  if (pair.reversed)
    return quantity0.div(quantity1)
  return quantity1.div(quantity0)
}

export function getTokenPricedBalance(ethereum: EthereumContext, account: string, token: ContractTokenInfo, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<FixedInit, Error>, more: IndexerMore) => {
    const key = `${ethereum.chain.chainId}/${token.address}`
    const value = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr(new Fixed(0n, 0))

    const indexQuery = await getPricedBalanceByToken(ethereum.user, account, coin, storage).make(more.core)
    await indexQuery.mutate(Mutators.mapInnerData(p => ({ ...p, [key]: value }), new Data({})))
  }

  return createQuerySchema<EthereumQueryKey<unknown>, FixedInit, Error>({
    key: {
      chainId: ethereum.chain.chainId,
      method: "eth_getTokenPricedBalance",
      params: [account, token.address, coin]
    },
    indexer,
    storage
  })
}

export function getTokenBalance(ethereum: EthereumContext, account: string, token: ContractTokenInfo, block: string, storage: IDBStorage) {
  const fetcher = async () => {
    try {
      const provider = new BrumeProvider(ethereum)
      const contract = new Contract(token.address, Erc20Abi, provider)
      const balance = await contract.balanceOf(account)
      const fixed = new Fixed(balance, token.decimals)

      return new Ok(new Data(fixed))
    } catch (e: unknown) {
      return new Err(FetchError.from(e))
    }
  }

  const indexer = async (states: States<FixedInit, Error>, more: IndexerMore) => {
    if (block !== "pending")
      return

    const pricedBalance = await Option.wrap(states.current.real?.data?.get()).andThen(async balance => {
      if (token.pairs == null)
        return new None()

      let pricedBalance: Fixed = Fixed.from(balance)

      for (const pairAddress of token.pairs) {
        const pair = pairByAddress[pairAddress]
        const chain = chainByChainId[pair.chainId]

        const price = await getPairPrice({ ...ethereum, chain }, pair, storage).make(more.core)

        if (price.data == null)
          return new None()

        pricedBalance = pricedBalance.mul(Fixed.from(price.data.inner))
      }

      return new Some(pricedBalance)
    }).then(o => o.unwrapOr(new Fixed(0n, 0)))

    const pricedBalanceQuery = await getTokenPricedBalance(ethereum, account, token, "usd", storage).make(more.core)
    await pricedBalanceQuery.mutate(Mutators.set(new Data(pricedBalance)))
  }

  return createQuerySchema<EthereumQueryKey<unknown>, FixedInit, Error>({
    key: {
      chainId: ethereum.chain.chainId,
      method: "eth_getTokenBalance",
      params: [account, token.address, block]
    },
    fetcher,
    indexer,
    storage
  })
}