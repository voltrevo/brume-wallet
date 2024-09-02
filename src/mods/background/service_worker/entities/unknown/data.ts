import { Fixed, ZeroHexString } from "@hazae41/cubane"
import { Data, FetcherMore, IDBQueryStorage, States, createQuery } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"
import { None, Some } from "@hazae41/option"
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

    export function schema(ethereum: BgEthereumContext, request: RpcRequestPreinit<unknown> & EthereumFetchParams, storage: IDBQueryStorage) {
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

          export interface Subdata {
            readonly count: number
            readonly value: Fixed.From
          }

          export type Key = string
          export type Data = Record<string, Subdata>
          export type Fail = never

          export function key(coin: "usd") {
            return `totalPricedBalanceByWallet/v2/${coin}`
          }

          export function schema(coin: "usd", storage: IDBQueryStorage) {
            const indexer = async (states: States<Data, Fail>) => {
              const { current, previous } = states

              const previousData = previous?.real?.current.ok()?.getOrNull()
              const currentData = current.real?.current.ok()?.getOrNull()

              const [record = {}] = [currentData]

              const total = Object.values(record).reduce<Fixed>((x, y) => {
                if (y.count === 0)
                  return x
                return Fixed.from(y.value).add(x)
              }, new Fixed(0n, 0))

              await Priced.schema(coin, storage).mutate(() => new Some(new Data(total)))
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

        export function schema(account: ZeroHexString, coin: "usd", storage: IDBQueryStorage) {
          const indexer = async (states: States<Data, Fail>) => {
            const { current, previous } = states

            const previousData = previous?.real?.current.ok()?.getOrNull()
            const currentData = current.real?.current.ok()?.getOrNull()

            const [value = new Fixed(0n, 0)] = [currentData]

            await Record.schema(coin, storage)?.mutate(s => {
              const { current } = s

              const [{ count = 0 } = {}] = [current?.ok().getOrNull()?.[account]]

              const inner = { count, value }

              if (current == null)
                return new Some(new Data({ [account]: inner }))
              if (current.isErr())
                return new None()

              return new Some(current.mapSync(c => ({ ...c, [account]: inner })))
            })
          }

          return createQuery<Key, Data, Fail>({
            key: key(account, coin),
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

      export function schema(currency: "usd", storage: IDBQueryStorage) {
        return createQuery<Key, Data, Fail>({
          key: key(currency),
          storage
        })
      }

    }

  }

}