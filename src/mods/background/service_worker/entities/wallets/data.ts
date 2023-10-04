import { ContractTokenInfo, EthereumChain, PairInfo, chainByChainId, pairByAddress, tokenByAddress } from "@/libs/ethereum/mods/chain"
import { Fixed, FixedInit, ZeroHexFixed } from "@/libs/fixed/fixed"
import { Maps } from "@/libs/maps/maps"
import { TorRpc } from "@/libs/rpc/rpc"
import { AbortSignals } from "@/libs/signals/signals"
import { Mutators } from "@/libs/xswr/mutators"
import { Cubane, ZeroHexString } from "@hazae41/cubane"
import { Data, Fail, Fetched, FetcherMore, IDBStorage, States, createQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { None, Option, Some } from "@hazae41/option"
import { Ok, Panic, Result } from "@hazae41/result"
import { EthBrume } from "../brumes/data"
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
    const indexer = async (states: States<WalletData, never>) => {
      return await Result.unthrow<Result<void, Error>>(async t => {
        const { current, previous = current } = states

        const previousData = previous.real?.data
        const currentData = current.real?.data

        const walletsQuery = Wallets.schema(storage)

        await walletsQuery.tryMutate(Mutators.mapData((d = new Data([])) => {
          if (previousData != null)
            d = d.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid))
          if (currentData != null)
            d = d.mapSync(p => [...p, WalletRef.from(currentData.inner)])
          return d
        })).then(r => r.throw(t))

        if (currentData?.inner.type === "seeded") {
          const { seed } = currentData.inner

          const walletsBySeedQuery = WalletsBySeed.Background.schema(seed.uuid, storage)

          await walletsBySeedQuery.tryMutate(Mutators.mapData((d = new Data([])) => {
            if (previousData != null)
              d = d.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid))
            if (currentData != null)
              d = d.mapSync(p => [...p, WalletRef.from(currentData.inner)])
            return d
          })).then(r => r.throw(t))
        }

        return Ok.void()
      })
    }

    return createQuery<Key, WalletData, never>({ key: key(uuid), storage, indexer })
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
  brume: EthBrume
  session?: SessionData
}

export async function tryEthereumFetch<T>(ethereum: EthereumContext, init: RpcRequestPreinit<unknown>, more: FetcherMore = {}) {
  return await Result.runAndDoubleWrap<Fetched<T, Error>>(async () => {
    const { signal: presignal } = more
    const { brume } = ethereum

    const pools = Option.wrap(brume[ethereum.chain.chainId]).ok().unwrap()

    async function runWithPoolOrThrow(index: number) {
      const pool = await pools.tryGet(index).then(r => r.unwrap().unwrap().inner)

      async function runWithConnOrThrow(index: number) {
        const conn = await pool.tryGet(index).then(r => r.unwrap().unwrap().inner)

        const { counter, connection } = conn
        const request = counter.prepare(init)

        if (connection.isURL()) {
          const { url, circuit } = connection
          const signal = AbortSignals.timeout(5_000, presignal)

          console.debug(`Fetching ${init.method} from ${url.href} using ${circuit.id}`)
          const result = await TorRpc.tryFetchWithCircuit<T>(url, { ...request, circuit, signal })

          if (result.isErr())
            console.debug(`Could not fetch ${init.method} from ${url.href} using ${circuit.id}`, { result })

          return Fetched.rewrap(result.unwrap())
        }

        if (connection.isWebSocket()) {
          await connection.cooldown

          const { socket, circuit } = connection
          const signal = AbortSignals.timeout(5_000, presignal)

          console.debug(`Fetching ${init.method} from ${socket.url} using ${circuit.id}`)
          const result = await TorRpc.tryFetchWithSocket<T>(socket, request, signal)

          if (result.isErr())
            console.debug(`Could not fetch ${init.method} from ${socket.url} using ${circuit.id}`, { result })

          return Fetched.rewrap(result.unwrap())
        }

        throw new Panic()
      }

      const promises = Array.from({ length: pool.capacity }, (_, i) => runWithConnOrThrow(i))
      const results = await Promise.allSettled(promises)

      const fetcheds = new Map<string, Fetched<T, Error>>()
      const counters = new Map<string, number>()

      for (const result of results) {
        if (result.status === "rejected")
          continue
        const raw = JSON.stringify(result.value.inner)
        const previous = Option.wrap(counters.get(raw)).unwrapOr(0)
        counters.set(raw, previous + 1)
        fetcheds.set(raw, result.value)
      }

      /**
       * One truth -> return it
       * Zero truth -> throw AggregateError
       */
      if (counters.size < 2)
        return await Promise.any(promises)

      console.warn(`Different results from multiple connections`)

      /**
       * Sort truths by occurence
       */
      const sorteds = [...Maps.entries(counters)].sort((a, b) => b.value - a.value)

      /**
       * Two concurrent truths
       */
      if (sorteds[0].value === sorteds[1].value) {
        console.warn(`Could not choose truth`)
        throw new Error(`Could not choose truth`)
      }

      return fetcheds.get(sorteds[0].key)!
    }

    const promises = Array.from({ length: pools.capacity }, (_, i) => runWithPoolOrThrow(i))
    const results = await Promise.allSettled(promises)

    const fetcheds = new Map<string, Fetched<T, Error>>()
    const counters = new Map<string, number>()

    for (const result of results) {
      if (result.status === "rejected")
        continue
      const raw = JSON.stringify(result.value.inner)
      const previous = Option.wrap(counters.get(raw)).unwrapOr(0)
      counters.set(raw, previous + 1)
      fetcheds.set(raw, result.value)
    }

    /**
     * One truth -> return it
     * Zero truth -> throw AggregateError
     */
    if (counters.size < 2)
      return await Promise.any(promises)

    console.warn(`Different results from multiple circuits`)

    /**
     * Sort truths by occurence
     */
    const sorteds = [...Maps.entries(counters)].sort((a, b) => b.value - a.value)

    /**
     * Two concurrent truths
     */
    if (sorteds[0].value === sorteds[1].value) {
      console.warn(`Could not choose truth`)
      throw new Error(`Could not choose truth`)
    }

    return fetcheds.get(sorteds[0].key)!
  })
}

export function getEthereumUnknown(ethereum: EthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
  const fetcher = async (request: RpcRequestPreinit<unknown>) =>
    await tryEthereumFetch<unknown>(ethereum, request)

  return createQuery<EthereumQueryKey<unknown>, any, Error>({
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
  return createQuery<string, FixedInit, Error>({
    key: `totalPricedBalance/${user.uuid}/${coin}`,
    storage
  })
}

export function getTotalPricedBalanceByWallet(user: User, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<Record<string, FixedInit>, Error>) => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr({})
      const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

      const totalBalance = getTotalPricedBalance(user, coin, storage)
      await totalBalance.tryMutate(Mutators.data<FixedInit, Error>(total)).then(r => r.throw(t))

      return Ok.void()
    })
  }

  return createQuery<string, Record<string, FixedInit>, Error>({
    key: `totalPricedBalanceByWallet/${user.uuid}/${coin}`,
    indexer,
    storage
  })
}

export function getTotalWalletPricedBalance(user: User, account: string, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<FixedInit, Error>) => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const value = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr(new Fixed(0n, 0))

      const indexQuery = getTotalPricedBalanceByWallet(user, coin, storage)
      await indexQuery.tryMutate(Mutators.mapInnerData(p => ({ ...p, [account]: value }), new Data({}))).then(r => r.throw(t))

      return Ok.void()
    })
  }

  return createQuery<string, FixedInit, Error>({
    key: `totalWalletPricedBalance/${account}/${coin}`,
    indexer,
    storage
  })
}

export function getPricedBalanceByToken(user: User, account: string, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<Record<string, FixedInit>, Error>) => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr({})
      const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

      const totalBalance = getTotalWalletPricedBalance(user, account, coin, storage)
      await totalBalance.tryMutate(Mutators.data<FixedInit, Error>(total)).then(r => r.throw(t))

      return Ok.void()
    })
  }

  return createQuery<string, Record<string, FixedInit>, Error>({
    key: `pricedBalanceByToken/${account}/${coin}`,
    indexer,
    storage
  })
}

export function getPricedBalance(ethereum: EthereumContext, account: string, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<FixedInit, Error>) => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const key = `${ethereum.chain.chainId}`
      const value = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr(new Fixed(0n, 0))

      const indexQuery = getPricedBalanceByToken(ethereum.user, account, coin, storage)
      await indexQuery.tryMutate(Mutators.mapInnerData(p => ({ ...p, [key]: value }), new Data({}))).then(r => r.throw(t))

      return Ok.void()
    })
  }

  return createQuery<EthereumQueryKey<unknown>, FixedInit, Error>({
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
  const fetcher = async (request: RpcRequestPreinit<unknown>) =>
    await tryEthereumFetch<ZeroHexString>(ethereum, request).then(r => r.mapSync(d => d.mapSync(x => new ZeroHexFixed(x, ethereum.chain.token.decimals))))

  const indexer = async (states: States<FixedInit, Error>) => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (block !== "pending")
        return Ok.void()

      const pricedBalance = await Option.wrap(states.current.real?.data?.get()).andThen(async balance => {
        if (ethereum.chain.token.pairs == null)
          return new None()

        let pricedBalance: Fixed = Fixed.from(balance)

        for (const pairAddress of ethereum.chain.token.pairs) {
          const pair = pairByAddress[pairAddress]
          const chain = chainByChainId[pair.chainId]

          const price = getPairPrice({ ...ethereum, chain }, pair, storage)
          const priceState = await price.state

          if (priceState.isErr())
            return new None()
          if (priceState.inner.data == null)
            return new None()

          pricedBalance = pricedBalance.mul(Fixed.from(priceState.inner.data.inner))
        }

        return new Some(pricedBalance)
      }).then(o => o.unwrapOr(new Fixed(0n, 0)))

      const pricedBalanceQuery = getPricedBalance(ethereum, account, "usd", storage)
      await pricedBalanceQuery.tryMutate(Mutators.set<FixedInit, Error>(new Data(pricedBalance))).then(r => r.throw(t))

      return Ok.void()
    })
  }

  return createQuery<EthereumQueryKey<unknown>, FixedInit, Error>({
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

export function getPairPrice(ethereum: EthereumContext, pair: PairInfo, storage: IDBStorage) {
  const fetcher = () => Result.unthrow<Result<Fetched<FixedInit, Error>, Error>>(async t => {
    const signature = Cubane.Abi.FunctionSignature.tryParse("getReserves()").throw(t)
    const data = Cubane.Abi.tryEncode(signature.args.from()).throw(t)

    const fetched = await tryEthereumFetch<ZeroHexString>(ethereum, {
      method: "eth_call",
      params: [{
        to: pair.address,
        data: data
      }, "pending"]
    }).then(r => r.throw(t))

    if (fetched.isErr())
      return new Ok(new Fail(fetched.inner))

    const returns = Cubane.Abi.createDynamicTuple(
      Cubane.Abi.createStaticBigUint(32),
      Cubane.Abi.createStaticBigUint(32))

    const [a, b] = Cubane.Abi.tryDecode(returns, fetched.inner).throw(t).inner.map(it => it.value)
    const price = computePairPrice(pair, [a, b])

    return new Ok(new Data(price))
  })

  return createQuery<EthereumQueryKey<unknown>, FixedInit, Error>({
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
  const indexer = async (states: States<FixedInit, Error>) => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      const key = `${ethereum.chain.chainId}/${token.address}`
      const value = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr(new Fixed(0n, 0))

      const indexQuery = getPricedBalanceByToken(ethereum.user, account, coin, storage)
      await indexQuery.tryMutate(Mutators.mapInnerData(p => ({ ...p, [key]: value }), new Data({}))).then(r => r.throw(t))

      return Ok.void()
    })
  }

  return createQuery<EthereumQueryKey<unknown>, FixedInit, Error>({
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
  const fetcher = () => Result.unthrow<Result<Fetched<FixedInit, Error>, Error>>(async t => {
    const signature = Cubane.Abi.FunctionSignature.tryParse("balanceOf(address)").throw(t)
    const data = Cubane.Abi.tryEncode(signature.args.from(account)).throw(t)

    const fetched = await tryEthereumFetch<ZeroHexString>(ethereum, {
      method: "eth_call",
      params: [{
        to: token.address,
        data: data
      }, "pending"]
    }).then(r => r.throw(t))

    if (fetched.isErr())
      return new Ok(new Fail(fetched.inner))

    const returns = Cubane.Abi.createStaticBigUint(32)
    const balance = Cubane.Abi.tryDecode(returns, fetched.inner).throw(t).value
    const fixed = new Fixed(balance, token.decimals)

    return new Ok(new Data(fixed))
  })

  const indexer = async (states: States<FixedInit, Error>) => {
    return await Result.unthrow<Result<void, Error>>(async t => {
      if (block !== "pending")
        return Ok.void()

      const pricedBalance = await Option.wrap(states.current.real?.data?.get()).andThen(async balance => {
        if (token.pairs == null)
          return new None()

        let pricedBalance: Fixed = Fixed.from(balance)

        for (const pairAddress of token.pairs) {
          const pair = pairByAddress[pairAddress]
          const chain = chainByChainId[pair.chainId]

          const price = getPairPrice({ ...ethereum, chain }, pair, storage)
          const priceState = await price.state

          if (priceState.isErr())
            return new None()
          if (priceState.inner.data == null)
            return new None()

          pricedBalance = pricedBalance.mul(Fixed.from(priceState.inner.data.inner))
        }

        return new Some(pricedBalance)
      }).then(o => o.unwrapOr(new Fixed(0n, 0)))

      const pricedBalanceQuery = getTokenPricedBalance(ethereum, account, token, "usd", storage)
      await pricedBalanceQuery.tryMutate(Mutators.set<FixedInit, Error>(new Data(pricedBalance))).then(r => r.throw(t))

      return Ok.void()
    })
  }

  return createQuery<EthereumQueryKey<unknown>, FixedInit, Error>({
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