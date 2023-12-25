import { TokenAbi } from "@/libs/abi/erc20.abi"
import { chainByChainId, pairByAddress, tokenByAddress } from "@/libs/ethereum/mods/chain"
import { Mutators } from "@/libs/glacier/mutators"
import { Cubane, Fixed, ZeroHexFixed, ZeroHexString } from "@hazae41/cubane"
import { Data, Fail, FetcherMore, IDBStorage, SimpleQuery, States, createQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { None, Option, Some } from "@hazae41/option"
import { Catched, Ok, Panic, Result } from "@hazae41/result"
import { BgEthereumContext } from "../../context"
import { BgPair, EthereumQueryKey, getPricedBalance, getTokenPricedBalance } from "../wallets/data"

export type Token =
  | TokenData
  | TokenRef

export type NativeToken =
  | NativeTokenData
  | NativeTokenRef

export type ContractToken =
  | ContractTokenData
  | ContractTokenRef

export type TokenRef =
  | NativeTokenRef
  | ContractTokenRef

export namespace TokenRef {
  export function from(token: TokenData) {
    if (token.type === "native")
      return NativeTokenRef.from(token)
    if (token.type === "contract")
      return ContractTokenRef.from(token)
    throw new Panic()
  }
}

export interface NativeTokenRef {
  readonly ref: true
  readonly uuid: string
  readonly type: "native"
  readonly chainId: number
}

export namespace NativeTokenRef {
  export function from(token: NativeTokenData): NativeTokenRef {
    const { uuid, type, chainId } = token
    return { ref: true, uuid, type, chainId }
  }
}

export interface ContractTokenRef {
  readonly ref: true
  readonly uuid: string
  readonly type: "contract"
  readonly chainId: number
  readonly address: ZeroHexString
}

export namespace ContractTokenRef {
  export function from(token: ContractTokenData): ContractTokenRef {
    const { uuid, type, chainId, address } = token
    return { ref: true, uuid, type, chainId, address }
  }
}

export type TokenData =
  | NativeTokenData
  | ContractTokenData

export interface NativeTokenData {
  readonly uuid: string
  readonly type: "native"
  readonly name: string
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
  readonly pairs?: readonly string[]
}

export interface ContractTokenData {
  readonly uuid: string
  readonly type: "contract",
  readonly name: string
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
  readonly address: ZeroHexString
  readonly pairs?: readonly ZeroHexString[]
}

export namespace BgNativeToken {

  export namespace Balance {

    export type Key = EthereumQueryKey<unknown>
    export type Data = Fixed.From
    export type Fail = Error

    export const method = "eth_getBalance"

    export function key(ethereum: BgEthereumContext, account: ZeroHexString, block: string) {
      return {
        version: 2,
        chainId: ethereum.chain.chainId,
        method: method,
        params: [account, block]
      }
    }

    export async function tryParse(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
      return await Result.unthrow<Result<SimpleQuery<EthereumQueryKey<unknown>, Fixed.From, Error>, Error>>(async t => {
        const [account, block] = (request as RpcRequestPreinit<[ZeroHexString, string]>).params
        const query = schema(ethereum, account, block, storage)
        return new Ok(query)
      })
    }

    export function schema(ethereum: BgEthereumContext, account: ZeroHexString, block: string, storage: IDBStorage) {
      const fetcher = async (request: RpcRequestPreinit<unknown>, more: FetcherMore) =>
        await BgEthereumContext.fetchOrFail<ZeroHexString>(ethereum, request, more).then(f => f.mapSync(x => new ZeroHexFixed(x, ethereum.chain.token.decimals)))

      const indexer = async (states: States<Fixed.From, Error>) => {
        if (block !== "pending")
          return

        const pricedBalance = await Option.wrap(states.current.real?.data?.get()).andThen(async balance => {
          if (ethereum.chain.token.pairs == null)
            return new None()

          let pricedBalance: Fixed = Fixed.from(balance)

          for (const pairAddress of ethereum.chain.token.pairs) {
            const pair = pairByAddress[pairAddress]
            const chain = chainByChainId[pair.chainId]

            const price = BgPair.Price.schema({ ...ethereum, chain }, pair, storage)
            const priceState = await price.state

            if (priceState.data == null)
              return new None()

            pricedBalance = pricedBalance.mul(Fixed.from(priceState.data.inner))
          }

          return new Some(pricedBalance)
        }).then(o => o.unwrapOr(new Fixed(0n, 0)))

        const pricedBalanceQuery = getPricedBalance(ethereum, account, "usd", storage)
        await pricedBalanceQuery.mutate(Mutators.set<Fixed.From, Error>(new Data(pricedBalance)))
      }

      return createQuery<Key, Data, Fail>({
        key: key(ethereum, account, block),
        fetcher,
        indexer,
        storage
      })
    }


  }

}

export namespace BgContractToken {

  export namespace All {

    export type Key = string
    export type Data = ContractToken[]
    export type Fail = never

    export const key = `contractTokens`

    export function schema(storage: IDBStorage) {
      return createQuery<string, ContractTokenRef[], never>({ key, storage })
    }

  }

  export namespace Balance {

    export type Key = EthereumQueryKey<unknown>
    export type Data = Fixed.From
    export type Fail = Error

    export const method = "eth_getTokenBalance"

    export function key(ethereum: BgEthereumContext, account: ZeroHexString, token: ContractTokenData, block: string) {
      return {
        chainId: ethereum.chain.chainId,
        method: method,
        params: [account, token.address, block]
      }
    }

    export async function tryParse(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
      return await Result.unthrow<Result<SimpleQuery<EthereumQueryKey<unknown>, Fixed.From, Error>, Error>>(async t => {
        const [account, address, block] = (request as RpcRequestPreinit<[ZeroHexString, string, string]>).params

        const tokenQuery = BgContractToken.schema(ethereum.chain.chainId, address, storage)
        const tokenState = await tokenQuery.state
        const tokenData = tokenState.data?.inner ?? tokenByAddress[address]

        const token = Option.wrap(tokenData).ok().throw(t)
        const query = schema(ethereum, account, token, block, storage)

        return new Ok(query)
      })
    }

    export function schema(ethereum: BgEthereumContext, account: ZeroHexString, token: ContractTokenData, block: string, storage: IDBStorage) {
      const fetcher = async (key: unknown, more: FetcherMore) => {
        try {
          const data = Cubane.Abi.encodeOrThrow(TokenAbi.balanceOf.from(account))

          const fetched = await BgEthereumContext.fetchOrFail<ZeroHexString>(ethereum, {
            method: "eth_call",
            params: [{
              to: token.address,
              data: data
            }, "pending"]
          }, more)

          if (fetched.isErr())
            return fetched

          const returns = Cubane.Abi.createTuple(Cubane.Abi.Uint256)
          const [balance] = Cubane.Abi.decodeOrThrow(returns, fetched.inner).inner
          const fixed = new Fixed(balance.intoOrThrow(), token.decimals)

          return new Data(fixed)
        } catch (e: unknown) {
          return new Fail(Catched.from(e))
        }
      }

      const indexer = async (states: States<Fixed.From, Error>) => {
        if (block !== "pending")
          return

        const pricedBalance = await Option.wrap(states.current.real?.data?.get()).andThen(async balance => {
          if (token.pairs == null)
            return new None()

          let pricedBalance: Fixed = Fixed.from(balance)

          for (const pairAddress of token.pairs) {
            const pair = pairByAddress[pairAddress]
            const chain = chainByChainId[pair.chainId]

            const price = BgPair.Price.schema({ ...ethereum, chain }, pair, storage)
            const priceState = await price.state

            if (priceState.data == null)
              return new None()

            pricedBalance = pricedBalance.mul(Fixed.from(priceState.data.inner))
          }

          return new Some(pricedBalance)
        }).then(o => o.unwrapOr(new Fixed(0n, 0)))

        const pricedBalanceQuery = getTokenPricedBalance(ethereum, account, token, "usd", storage)
        await pricedBalanceQuery.mutate(Mutators.set<Fixed.From, Error>(new Data(pricedBalance)))
      }

      return createQuery<EthereumQueryKey<unknown>, Fixed.From, Error>({
        key: key(ethereum, account, token, block),
        fetcher,
        indexer,
        storage
      })
    }

  }

  export type Key = string
  export type Data = ContractTokenData
  export type Fail = never

  export function key(chainId: number, address: string) {
    return `contractToken/${chainId}/${address}`
  }

  export function schema(chainId: number, address: string, storage: IDBStorage) {
    const indexer = async (states: States<ContractTokenData, never>) => {
      const { current, previous } = states

      const previousData = previous?.real?.data?.inner
      const currentData = current.real?.data?.inner

      if (previousData?.uuid === currentData?.uuid)
        return

      if (previousData != null) {
        await All.schema(storage)?.mutate(Mutators.mapData((d = new Data([])) => {
          return d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
        }))
      }

      if (currentData != null) {
        await All.schema(storage)?.mutate(Mutators.mapData((d = new Data([])) => {
          return d.mapSync(p => [...p, ContractTokenRef.from(currentData)])
        }))
      }
    }

    return createQuery<Key, Data, Fail>({
      key: key(chainId, address),
      indexer,
      storage
    })
  }

}