import { ZeroHexBigInt } from "@/libs/bigints/bigints"
import { EthereumChainfulRpcRequestPreinit, EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { EthereumContext } from "@/mods/universal/context/ethereum"
import { Fixed, ZeroHexString } from "@hazae41/cubane"
import { createQuery, Data, QueryStorage, States } from "@hazae41/glacier"
import { None, Nullable, Option, Some } from "@hazae41/option"
import { GetBalance } from "../../../core"
import { ERC20, ERC20Metadata } from "../erc20"

export namespace Balance {

  export namespace Native {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = Fixed.From
    export type F = Error

    export function keyOrThrow(chainId: number, account: ZeroHexString, block: string) {
      return {
        chainId: chainId,
        method: "eth_getNativeTokenBalance",
        params: [account, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, account: Nullable<ZeroHexString>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (account == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const balanceFetched = await GetBalance.queryOrThrow(context, account, block, storage)!.fetchOrThrow(init).then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (balanceFetched.isErr())
          return balanceFetched

        const balanceBigInt = ZeroHexBigInt.from(balanceFetched.get()).value
        const balanceFixed = new Fixed(balanceBigInt, 18)

        return new Data(balanceFixed, balanceFetched)
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, account, block),
        fetcher,
        storage
      })
    }

  }

  export namespace Contract {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = Fixed.From
    export type F = Error

    export function keyOrThrow(chainId: number, contract: ZeroHexString, account: ZeroHexString, block: string) {
      return {
        chainId: chainId,
        method: "eth_getContractTokenBalance",
        params: [contract, account, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, contract: Nullable<ZeroHexString>, account: Nullable<ZeroHexString>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (contract == null)
        return
      if (account == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const decimalsFetched = await ERC20Metadata.Decimals.queryOrThrow(context, contract, block, storage)!.fetchOrThrow().then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (decimalsFetched.isErr())
          return decimalsFetched

        const balanceFetched = await ERC20.BalanceOf.queryOrThrow(context, contract, account, block, storage)!.fetchOrThrow(init).then(r => Option.wrap(r.getAny().real?.current).getOrThrow())

        if (balanceFetched.isErr())
          return balanceFetched

        const balanceBigInt = ZeroHexBigInt.from(balanceFetched.get()).value
        const balanceFixed = new Fixed(balanceBigInt, decimalsFetched.get())

        return new Data(balanceFixed, balanceFetched)
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, contract, account, block),
        fetcher,
        storage
      })
    }

  }

  export namespace Priced {

    export namespace Total {

      export namespace Total {

        export type K = EthereumChainlessRpcRequestPreinit<unknown>
        export type D = Fixed.From
        export type F = never

        export function keyOrThrow(account: ZeroHexString, currency: "usd") {
          return {
            chainId: "*",
            method: "eth_getTotalBalance",
            params: [account, currency]
          }
        }

        export function queryOrThrow(account: Nullable<ZeroHexString>, currency: Nullable<"usd">, storage: QueryStorage) {
          if (account == null)
            return
          if (currency == null)
            return

          const indexer = async (states: States<D, F>) => {

          }

          return createQuery<K, D, F>({
            key: keyOrThrow(account, currency),
            indexer,
            storage
          })
        }

      }

      export namespace Index {

        export type K = EthereumChainlessRpcRequestPreinit<unknown>
        export type D = Record<string, Fixed.From>
        export type F = never

        export function keyOrThrow(account: ZeroHexString, currency: "usd") {
          return {
            chainId: "*",
            method: "eth_getBalances",
            params: [account, currency]
          }
        }

        export function queryOrThrow(account: Nullable<ZeroHexString>, currency: Nullable<"usd">, storage: QueryStorage) {
          if (account == null)
            return
          if (currency == null)
            return

          const indexer = async (states: States<D, F>) => {
            const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).getOr({})
            const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

            const totalQuery = Total.queryOrThrow(account, currency, storage)
            await totalQuery!.mutateOrThrow(() => new Some(new Data(total)))
          }

          return createQuery<K, D, F>({
            key: keyOrThrow(account, currency),
            indexer,
            storage
          })
        }


      }

      export type K = EthereumChainfulRpcRequestPreinit<unknown>
      export type D = Fixed.From
      export type F = never

      export function keyOrThrow(chainId: number, account: ZeroHexString, currency: "usd", block: string) {
        return {
          chainId: chainId,
          method: "eth_getTotalBalance",
          params: [account, currency, block]
        }
      }

      export function queryOrThrow(context: Nullable<EthereumContext>, account: Nullable<ZeroHexString>, currency: Nullable<"usd">, block: string, storage: QueryStorage) {
        if (context == null)
          return
        if (account == null)
          return
        if (currency == null)
          return
        if (block == null)
          return

        const indexer = async (states: States<D, F>) => {
          const { current } = states

          const data = current.real?.current.checkOrNull()
          const [value = new Fixed(0n, 0)] = [data?.get()]

          await Index.queryOrThrow(account, currency, storage)?.mutateOrThrow(s => {
            const { current } = s

            if (current == null)
              return new Some(new Data({ [context.chain.chainId]: value }))
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(c => ({ ...c, [context.chain.chainId]: value })))
          })
        }

        return createQuery<K, D, F>({
          key: keyOrThrow(context.chain.chainId, account, currency, block),
          indexer,
          storage
        })
      }

    }

    export namespace Index {

      export type K = EthereumChainfulRpcRequestPreinit<unknown>
      export type D = Record<string, Fixed.From>
      export type F = never

      export function keyOrThrow(chainId: number, account: ZeroHexString, currency: "usd", block: string) {
        return {
          chainId: chainId,
          method: "eth_getBalances",
          params: [account, currency, block]
        }
      }

      export function queryOrThrow(context: Nullable<EthereumContext>, account: Nullable<ZeroHexString>, currency: Nullable<"usd">, block: string, storage: QueryStorage) {
        if (context == null)
          return
        if (account == null)
          return
        if (currency == null)
          return
        if (block == null)
          return

        const indexer = async (states: States<D, F>) => {
          const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).getOr({})
          const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

          const totalQuery = Total.queryOrThrow(context, account, currency, block, storage)
          await totalQuery!.mutateOrThrow(() => new Some(new Data(total)))
        }

        return createQuery<K, D, F>({
          key: keyOrThrow(context.chain.chainId, account, currency, block),
          indexer,
          storage
        })
      }

    }

    export namespace Native {

      export type K = EthereumChainfulRpcRequestPreinit<unknown>
      export type D = Fixed.From
      export type F = never

      export function keyOrThrow(chainId: number, account: ZeroHexString, currency: "usd", block: string) {
        return {
          chainId: chainId,
          method: "eth_getNativeTokenPricedBalance",
          params: [account, currency, block]
        }
      }

      export function queryOrThrow(context: Nullable<EthereumContext>, account: Nullable<ZeroHexString>, currency: Nullable<"usd">, block: Nullable<string>, storage: QueryStorage) {
        if (context == null)
          return
        if (account == null)
          return
        if (currency == null)
          return
        if (block == null)
          return

        const indexer = async (states: States<D, F>) => {
          const { current } = states

          const data = current.real?.current.checkOrNull()
          const [value = new Fixed(0n, 0)] = [data?.get()]

          await Index.queryOrThrow(context, account, currency, block, storage)!.mutateOrThrow(s => {
            const { current } = s

            if (current == null)
              return new Some(new Data({ ["0x0"]: value }))
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(c => ({ ...c, ["0x0"]: value })))
          })
        }

        return createQuery<K, D, F>({
          key: keyOrThrow(context.chain.chainId, account, currency, block),
          indexer,
          storage
        })
      }

    }

    export namespace Contract {

      export type K = EthereumChainfulRpcRequestPreinit<unknown>
      export type D = Fixed.From
      export type F = never

      export function keyOrThrow(chainId: number, contract: ZeroHexString, account: ZeroHexString, currency: "usd", block: string) {
        return {
          chainId: chainId,
          method: "eth_getContractTokenPricedBalance",
          params: [contract, account, currency, block]
        }
      }

      export function queryOrThrow(context: Nullable<EthereumContext>, contract: Nullable<ZeroHexString>, account: Nullable<ZeroHexString>, currency: Nullable<"usd">, block: Nullable<string>, storage: QueryStorage) {
        if (context == null)
          return
        if (contract == null)
          return
        if (account == null)
          return
        if (currency == null)
          return
        if (block == null)
          return

        const indexer = async (states: States<D, F>) => {
          const { current } = states

          const data = current.real?.current.checkOrNull()
          const [value = new Fixed(0n, 0)] = [data?.get()]

          await Index.queryOrThrow(context, account, currency, block, storage)!.mutateOrThrow(s => {
            const { current } = s

            if (current == null)
              return new Some(new Data({ [contract]: value }))
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(c => ({ ...c, [contract]: value })))
          })
        }

        return createQuery<K, D, F>({
          key: keyOrThrow(context.chain.chainId, contract, account, currency, block),
          indexer,
          storage
        })
      }

    }

  }
}