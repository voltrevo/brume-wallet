import { Mutators } from "@/libs/glacier/mutators"
import { Fixed } from "@hazae41/cubane"
import { Data, FetcherMore, IDBStorage, States, createQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { Option } from "@hazae41/option"
import { BgEthereumContext } from "../../context"
import { EthereumFetchParams, EthereumQueryKey } from "../wallets/data"

export namespace BgEthereum {

  export namespace Unknown {

    export type Key = EthereumQueryKey<unknown> & EthereumFetchParams
    export type Data = unknown
    export type Fail = Error

    export function key(chainId: number, request: RpcRequestPreinit<unknown> & EthereumFetchParams) {
      const { method, params, noCheck } = request
      return { chainId, method, params, noCheck }
    }

    export function schema(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown> & EthereumFetchParams, storage: IDBStorage) {
      const fetcher = async (request: EthereumQueryKey<unknown> & EthereumFetchParams, more: FetcherMore) =>
        await BgEthereumContext.fetchOrFail<unknown>(ethereum, request, more)

      return createQuery<Key, Data, Fail>({
        key: key(ethereum.chain.chainId, request),
        fetcher,
        storage
      })
    }

  }

}

export namespace BgTotal {

  export namespace Balance {

    export namespace Priced {

      export namespace ByAddress {

        export namespace Record {

          export type Key = string
          export type Data = Record<string, Fixed.From>
          export type Fail = never

          export function key(coin: "usd") {
            return `totalPricedBalanceByWallet/${coin}`
          }

          export function schema(coin: "usd", storage: IDBStorage) {
            const indexer = async (states: States<Data, Fail>) => {
              const values = Option.wrap(states.current.real?.data?.get()).unwrapOr({})
              const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

              const totalQuery = Priced.schema(coin, storage)
              await totalQuery.mutate(Mutators.data<Fixed.From, never>(total))
            }

            return createQuery<Key, Data, Fail>({ key: key(coin), indexer, storage })
          }

        }

        export type Key = string
        export type Data = Fixed.From
        export type Fail = never

        export function key(address: string, coin: "usd") {
          return `totalWalletPricedBalance/${address}/${coin}`
        }

        export function schema(address: string, coin: "usd", storage: IDBStorage) {
          const indexer = async (states: States<Data, Fail>) => {
            const indexQuery = Record.schema(coin, storage)

            const value = Option.wrap(states.current.real?.data?.get()).unwrapOr(new Fixed(0n, 0))
            await indexQuery.mutate(Mutators.mapInnerData(p => ({ ...p, [address]: value }), new Data({})))
          }

          return createQuery<Key, Data, Fail>({
            key: key(address, coin),
            indexer,
            storage
          })
        }

      }

      export type Key = string
      export type Data = Fixed.From
      export type Fail = never

      export function key(currency: "usd") {
        return `totalPricedBalance/${currency}`
      }

      export function schema(currency: "usd", storage: IDBStorage) {
        return createQuery<Key, Data, Fail>({
          key: key(currency),
          storage
        })
      }

    }

  }

}