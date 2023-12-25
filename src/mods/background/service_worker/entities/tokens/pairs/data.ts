import { PairAbi } from "@/libs/abi/pair.abi"
import { PairInfo, pairByAddress, tokenByAddress } from "@/libs/ethereum/mods/chain"
import { Mutators } from "@/libs/glacier/mutators"
import { Abi, Fixed, ZeroHexString } from "@hazae41/cubane"
import { Data, Fetched, FetcherMore, IDBStorage, States, createQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { Option } from "@hazae41/option"
import { BgEthereumContext } from "../../../context"
import { EthereumQueryKey, getPricedBalanceByToken } from "../../wallets/data"
import { ContractTokenData } from "../data"

export namespace BgPair {

  export namespace Price {

    export type Key = EthereumQueryKey<unknown>
    export type Data = Fixed.From
    export type Fail = Error

    export const method = "eth_getPairPrice"

    export function key(ethereum: BgEthereumContext, pair: PairInfo) {
      return {
        chainId: ethereum.chain.chainId,
        method: "eth_getPairPrice",
        params: [pair.address]
      }
    }

    export async function parseOrThrow(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown>, storage: IDBStorage) {
      const [address] = (request as RpcRequestPreinit<[ZeroHexString]>).params

      const pair = Option.unwrap(pairByAddress[address])

      return schema(ethereum, pair, storage)
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

        const price = computeOrThrow(pair, [a, b])

        return new Data(price)
      })

      return createQuery<Key, Data, Fail>({
        key: key(ethereum, pair),
        fetcher,
        storage
      })
    }

    export function computeOrThrow(pair: PairInfo, reserves: [bigint, bigint]) {
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