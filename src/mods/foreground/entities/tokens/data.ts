import { chainDataByChainId, pairByAddress } from "@/libs/ethereum/mods/chain"
import { Mutators } from "@/libs/glacier/mutators"
import { BgToken, ContractTokenData, ContractTokenRef } from "@/mods/background/service_worker/entities/tokens/data"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { Fixed, ZeroHexFixedInit, ZeroHexString } from "@hazae41/cubane"
import { createQuery, Data, Fail, States, useQuery } from "@hazae41/glacier"
import { None, Nullable, Option, Some } from "@hazae41/option"
import { Catched } from "@hazae41/result"
import { FgTotal } from "../unknown/data"
import { FgEthereumContext } from "../wallets/data"

export namespace FgToken {

  export namespace Balance {

    export type K = BgToken.Balance.K
    export type D = BgToken.Balance.D
    export type F = BgToken.Balance.F

    export const key = BgToken.Balance.key

    export function schema(address: Nullable<ZeroHexString>, currency: "usd", storage: UserStorage) {
      if (address == null)
        return

      const indexer = async (states: States<D, F>) => {
        const values = Option.wrap(states.current.real?.data).mapSync(d => d.inner).getOr({})
        const total = Object.values(values).reduce<Fixed>((x, y) => Fixed.from(y).add(x), new Fixed(0n, 0))

        const totalBalance = FgTotal.Balance.Priced.ByAddress.schema(address, currency, storage)
        await totalBalance?.mutateOrThrow(Mutators.data<Fixed.From, never>(total))
      }

      return createQuery<K, D, F>({ key: key(address, currency), indexer, storage })
    }

  }

  export namespace Native {

    export namespace Balance {

      export namespace Priced {

        export type K = BgToken.Native.Balance.Priced.K
        export type D = BgToken.Native.Balance.Priced.D
        export type F = BgToken.Native.Balance.Priced.F

        export const key = BgToken.Native.Balance.Priced.key

        export function schema(account: Nullable<ZeroHexString>, coin: "usd", context: Nullable<FgEthereumContext>, storage: UserStorage) {
          if (context == null)
            return
          if (account == null)
            return

          const indexer = async (states: States<D, F>) => {
            const { current, previous } = states

            const previousData = previous?.real?.current.ok()?.getOrNull()
            const currentData = current.real?.current.ok()?.getOrNull()

            const key = `${context.chain.chainId}`
            const [value = new Fixed(0n, 0)] = [currentData]

            await FgToken.Balance.schema(account, coin, storage)?.mutateOrThrow(s => {
              const { current } = s

              if (current == null)
                return new Some(new Data({ [key]: value }))
              if (current.isErr())
                return new None()

              return new Some(current.mapSync(c => ({ ...c, [key]: value })))
            })
          }

          return createQuery<K, D, F>({
            key: key(account, coin, context.chain),
            indexer,
            storage
          })
        }

      }

      export type K = BgToken.Native.Balance.K
      export type D = BgToken.Native.Balance.D
      export type F = BgToken.Native.Balance.F

      export const key = BgToken.Native.Balance.key

      export function schema(address: Nullable<ZeroHexString>, block: Nullable<string>, context: Nullable<FgEthereumContext>, storage: UserStorage) {
        if (address == null)
          return
        if (context == null)
          return
        if (block == null)
          return

        const fetcher = async (request: K, init: RequestInit = {}) => {
          try {
            const fetched = await context.fetchOrFail<ZeroHexString>(request)

            if (fetched.isErr())
              return fetched
            if (!ZeroHexString.Unknown.is(fetched.get()))
              throw new Error("Invalid response")

            const fixed = new ZeroHexFixedInit(fetched.get(), context.chain.token.decimals)

            return new Data(fixed)
          } catch (e: unknown) {
            return new Fail(Catched.wrap(e))
          }
        }

        const indexer = async (states: States<D, F>) => {
          if (block !== "pending")
            return

          const pricedBalance = await Option.wrap(states.current.real?.current.ok().getOrNull()).andThen(async balance => {
            if (context.chain.token.pairs == null)
              return new None()

            let pricedBalance: Fixed = Fixed.from(balance)

            for (const pairAddress of context.chain.token.pairs) {
              const pairData = pairByAddress[pairAddress]
              const chainData = chainDataByChainId[pairData.chainId]

              if (pairData.version === 2) {
                const priceQuery = PairV2.Price.queryOrThrow(context.switch(chainData), pairData, block, storage)
                const priceState = await priceQuery?.state

                if (priceState?.data == null)
                  return new None()

                pricedBalance = pricedBalance.mul(Fixed.from(priceState.data.get()))
                continue
              }

              if (pairData.version === 3) {
                const priceQuery = PairV3.Price.queryOrThrow(context.switch(chainData), pairData, block, storage)
                const priceState = await priceQuery?.state

                if (priceState?.data == null)
                  return new None()

                pricedBalance = pricedBalance.mul(Fixed.from(priceState.data.get()))
                continue
              }

              return new None()
            }

            return new Some(new Data(pricedBalance))
          }).then(o => o.getOrNull())

          const pricedBalanceQuery = Priced.schema(address, "usd", context, storage)
          await pricedBalanceQuery?.mutateOrThrow(() => new Some(pricedBalance))
        }

        return createQuery<K, D, F>({
          key: key(address, block, context.chain),
          fetcher,
          indexer,
          storage
        })

      }
    }
  }

  export namespace Contract {

    export namespace Balance {

      export namespace Priced {

        export type K = BgToken.Contract.Balance.Priced.K
        export type D = BgToken.Contract.Balance.Priced.D
        export type F = BgToken.Contract.Balance.Priced.F

        export const key = BgToken.Contract.Balance.Priced.key

        export function schema(account: Nullable<ZeroHexString>, token: Nullable<ContractTokenData>, coin: "usd", context: Nullable<FgEthereumContext>, storage: UserStorage) {
          if (context == null)
            return
          if (account == null)
            return
          if (token == null)
            return

          const indexer = async (states: States<D, F>) => {
            const { current, previous } = states

            const previousData = previous?.real?.current.ok()?.getOrNull()
            const currentData = current.real?.current.ok()?.getOrNull()

            const key = `${context.chain.chainId}/${token.address}`
            const [value = new Fixed(0n, 0)] = [currentData]

            await FgToken.Balance.schema(account, coin, storage)?.mutateOrThrow(s => {
              const { current } = s

              if (current == null)
                return new Some(new Data({ [key]: value }))
              if (current.isErr())
                return new None()

              return new Some(current.mapSync(c => ({ ...c, [key]: value })))
            })
          }

          return createQuery<K, D, F>({
            key: key(account, token, coin, context.chain),
            indexer,
            storage
          })
        }

      }

    }

    export namespace All {

      export type K = BgToken.Contract.All.K
      export type D = BgToken.Contract.All.D
      export type F = BgToken.Contract.All.F

      export const key = BgToken.Contract.All.key

      export function schema(storage: UserStorage) {
        return createQuery<K, D, F>({ key, storage })
      }

    }

    export type K = BgToken.Contract.K
    export type D = BgToken.Contract.D
    export type F = BgToken.Contract.F

    export const key = BgToken.Contract.key

    export function schema(chainId: Nullable<number>, address: Nullable<string>, storage: UserStorage) {
      if (chainId == null)
        return
      if (address == null)
        return

      const indexer = async (states: States<D, F>) => {
        const { current, previous } = states

        const previousData = previous?.real?.current.ok()?.getOrNull()
        const currentData = current.real?.current.ok()?.getOrNull()

        if (previousData?.uuid === currentData?.uuid)
          return

        if (previousData != null) {
          await All.schema(storage)?.mutateOrThrow(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
          }))
        }

        if (currentData != null) {
          await All.schema(storage)?.mutateOrThrow(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => [...p, ContractTokenRef.from(currentData)])
          }))
        }
      }

      return createQuery<K, D, F>({
        key: key(chainId, address),
        indexer,
        storage
      })
    }

  }

}

export function useToken(chainId: Nullable<number>, address: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgToken.Contract.schema, [chainId, address, storage])

  return query
}

export function useTokens() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgToken.Contract.All.schema, [storage])

  return query
}
