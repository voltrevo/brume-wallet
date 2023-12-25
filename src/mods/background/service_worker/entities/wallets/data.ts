import { PairAbi } from "@/libs/abi/pair.abi"
import { PairInfo, pairByAddress, tokenByAddress } from "@/libs/ethereum/mods/chain"
import { Mutators } from "@/libs/glacier/mutators"
import { Abi, Fixed, ZeroHexString } from "@hazae41/cubane"
import { Data, Fetched, FetcherMore, IDBStorage, SimpleQuery, States, createQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { Option } from "@hazae41/option"
import { Ok, Result } from "@hazae41/result"
import { BgEthereumContext } from "../../context"
import { WalletsBySeed } from "../seeds/all/data"
import { SeedRef } from "../seeds/data"
import { ContractTokenData } from "../tokens/data"

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

  export function create(uuid: string): WalletRef {
    return { ref: true, uuid }
  }

  export function from(wallet: Wallet): WalletRef {
    return create(wallet.uuid)
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
  | EthereumTrezorWalletData

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

  readonly address: ZeroHexString
}

export interface EthereumUnauthPrivateKeyWalletData {
  readonly coin: "ethereum"
  readonly type: "privateKey"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: ZeroHexString

  readonly privateKey: string
}

export interface EthereumAuthPrivateKeyWalletData {
  readonly coin: "ethereum"
  readonly type: "authPrivateKey"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: ZeroHexString

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

  readonly address: ZeroHexString

  readonly seed: SeedRef
  readonly path: string
}

export interface EthereumTrezorWalletData {
  readonly coin: "ethereum"
  readonly type: "trezor"

  readonly uuid: string
  readonly name: string,

  readonly color: number,
  readonly emoji: string

  readonly address: ZeroHexString

  readonly path: string
}

export namespace BgWallet {

  export namespace All {

    export type Key = string
    export type Data = Wallet[]
    export type Fail = never

    export const key = `wallets`

    export type Schema = ReturnType<typeof schema>

    export function schema(storage: IDBStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

  export type Key = string
  export type Data = WalletData
  export type Fail = never

  export function key(uuid: string) {
    return `wallet/${uuid}`
  }

  export function schema(uuid: string, storage: IDBStorage) {
    const indexer = async (states: States<WalletData, never>) => {
      const { current, previous = current } = states

      const previousData = previous.real?.data
      const currentData = current.real?.data

      await All.schema(storage).mutate(Mutators.mapData((d = new Data([])) => {
        if (previousData?.inner.uuid === currentData?.inner.uuid)
          return d
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid))
        if (currentData != null)
          d = d.mapSync(p => [...p, WalletRef.from(currentData.inner)])
        return d
      }))

      if (currentData?.inner.type === "seeded") {
        const { seed } = currentData.inner

        const walletsBySeedQuery = WalletsBySeed.Background.schema(seed.uuid, storage)

        await walletsBySeedQuery.mutate(Mutators.mapData((d = new Data([])) => {
          if (previousData?.inner.uuid === currentData?.inner.uuid)
            return d
          if (previousData != null)
            d = d.mapSync(p => p.filter(x => x.uuid !== previousData.inner.uuid))
          if (currentData != null)
            d = d.mapSync(p => [...p, WalletRef.from(currentData.inner)])
          return d
        }))
      }
    }

    return createQuery<Key, Data, never>({
      key: key(uuid),
      storage,
      indexer
    })
  }

}

export type EthereumQueryKey<T> = RpcRequestPreinit<T> & {
  version?: number
  chainId: number
}

export interface EthereumFetchParams {
  noCheck?: boolean
}

export function getTotalPricedBalance(coin: "usd", storage: IDBStorage) {
  return createQuery<string, Fixed.From, Error>({
    key: `totalPricedBalance/${coin}`,
    storage
  })
}

export function getTotalPricedBalanceByWallet(coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<Record<string, Fixed.From>, Error>) => {
    const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr({})
    const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

    const totalBalance = getTotalPricedBalance(coin, storage)
    await totalBalance.mutate(Mutators.data<Fixed.From, Error>(total))
  }

  return createQuery<string, Record<string, Fixed.From>, Error>({
    key: `totalPricedBalanceByWallet/${coin}`,
    indexer,
    storage
  })
}

export function getTotalWalletPricedBalance(account: string, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<Fixed.From, Error>) => {
    const value = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr(new Fixed(0n, 0))

    const indexQuery = getTotalPricedBalanceByWallet(coin, storage)
    await indexQuery.mutate(Mutators.mapInnerData(p => ({ ...p, [account]: value }), new Data({})))
  }

  return createQuery<string, Fixed.From, Error>({
    key: `totalWalletPricedBalance/${account}/${coin}`,
    indexer,
    storage
  })
}

export function getPricedBalanceByToken(account: string, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<Record<string, Fixed.From>, Error>) => {
    const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr({})
    const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

    const totalBalance = getTotalWalletPricedBalance(account, coin, storage)
    await totalBalance.mutate(Mutators.data<Fixed.From, Error>(total))
  }

  return createQuery<string, Record<string, Fixed.From>, Error>({
    key: `pricedBalanceByToken/${account}/${coin}`,
    indexer,
    storage
  })
}

export function getPricedBalance(ethereum: BgEthereumContext, account: string, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<Fixed.From, Error>) => {
    const key = `${ethereum.chain.chainId}`
    const value = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr(new Fixed(0n, 0))

    const indexQuery = getPricedBalanceByToken(account, coin, storage)
    await indexQuery.mutate(Mutators.mapInnerData(p => ({ ...p, [key]: value }), new Data({})))
  }

  return createQuery<EthereumQueryKey<unknown>, Fixed.From, Error>({
    key: {
      chainId: ethereum.chain.chainId,
      method: "eth_getPricedBalance",
      params: [account, coin]
    },
    indexer,
    storage
  })
}

export namespace BgPair {

  export namespace Price {

    export const method = "eth_getPairPrice"

    export function key(ethereum: BgEthereumContext, pair: PairInfo) {
      return {
        chainId: ethereum.chain.chainId,
        method: "eth_getPairPrice",
        params: [pair.address]
      }
    }

    export async function tryParse(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
      return await Result.unthrow<Result<SimpleQuery<EthereumQueryKey<unknown>, Fixed.From, Error>, Error>>(async t => {
        const [address] = (request as RpcRequestPreinit<[ZeroHexString]>).params
        const pair = Option.wrap(pairByAddress[address]).ok().throw(t)
        const query = schema(ethereum, pair, storage)
        return new Ok(query)
      })
    }

    export function schema(ethereum: BgEthereumContext, pair: PairInfo, storage: IDBStorage) {
      const fetcher = (key: unknown, more: FetcherMore) => Fetched.runOrDoubleWrap(async () => {
        const data = Abi.encodeOrThrow(PairAbi.getReserves.from())

        const fetched = await BgEthereumContext.fetchOrFail<ZeroHexString>(ethereum, {
          method: "eth_call",
          params: [{
            to: pair.address,
            data: data
          }, "pending"]
        }, more)

        if (fetched.isErr())
          return fetched

        const returns = Abi.createTuple(Abi.Uint112, Abi.Uint112, Abi.Uint32)
        const [a, b] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

        const price = compute(pair, [a, b])

        return new Data(price)
      })

      return createQuery<EthereumQueryKey<unknown>, Fixed.From, Error>({
        key: key(ethereum, pair),
        fetcher,
        storage
      })
    }

    export function compute(pair: PairInfo, reserves: [bigint, bigint]) {
      const decimals0 = tokenByAddress[pair.token0].decimals
      const decimals1 = tokenByAddress[pair.token1].decimals

      const [reserve0, reserve1] = reserves

      const quantity0 = new Fixed(reserve0, decimals0)
      const quantity1 = new Fixed(reserve1, decimals1)

      if (pair.reversed)
        return quantity0.div(quantity1)

      return quantity1.div(quantity0)
    }

  }

}

export function getTokenPricedBalance(ethereum: BgEthereumContext, account: string, token: ContractTokenData, coin: "usd", storage: IDBStorage) {
  const indexer = async (states: States<Fixed.From, Error>) => {
    const key = `${ethereum.chain.chainId}/${token.address}`
    const value = Option.wrap(states.current.real?.data).mapSync(d => d.inner).unwrapOr(new Fixed(0n, 0))

    const indexQuery = getPricedBalanceByToken(account, coin, storage)
    await indexQuery.mutate(Mutators.mapInnerData(p => ({ ...p, [key]: value }), new Data({})))
  }

  return createQuery<EthereumQueryKey<unknown>, Fixed.From, Error>({
    key: {
      chainId: ethereum.chain.chainId,
      method: "eth_getTokenPricedBalance",
      params: [account, token.address, coin]
    },
    indexer,
    storage
  })
}