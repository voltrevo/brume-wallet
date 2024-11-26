import { RankingAbi, RegistryAbi } from "@/libs/abi/contest.abi"
import { EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { Abi, Address, ZeroHexString } from "@hazae41/cubane"
import { createQuery, Data, Fail, JsonRequest, QueryStorage, Times } from "@hazae41/glacier"
import { Nullable, Option } from "@hazae41/option"
import { Catched } from "@hazae41/result"
import { BlockNumber } from "../../../blocks"
import { EthereumContext } from "../../../context"
import { TokenInfo } from "../core"

export namespace Contest {

  export namespace Ranking {

    export namespace AddressOf {

      export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
      export type D = Address
      export type F = Error

      export function keyOrThrow(chainId: 1, rank: number, block: BlockNumber) {
        const body = {
          method: "eth_call",
          params: [{
            to: "0x15ca4c2c6284e3a7DAe8349Cf6B671FF4a12F580",
            data: Abi.encodeOrThrow(RankingAbi.addressOf.fromOrThrow(rank))
          }, block]
        } as const

        return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
      }

      export function queryOrThrow(context: Nullable<EthereumContext<1>>, rank: Nullable<number>, block: Nullable<BlockNumber>, storage: QueryStorage) {
        if (context == null)
          return
        if (rank == null)
          return
        if (block == null)
          return

        const fetcher = async (request: K, init: RequestInit = {}) => {
          try {
            const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
            const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

            if (fetched.isErr())
              return fetched

            const returns = Abi.Tuple.create(Abi.Address)
            const [address] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

            const cooldown = Date.now() + (1000 * 60)
            const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

            return new Data(address, { cooldown, expiration })
          } catch (e: unknown) {
            return new Fail(Catched.wrap(e))
          }
        }

        return createQuery<K, D, F>({
          key: keyOrThrow(context.chain.chainId, rank, block),
          fetcher,
          storage
        })
      }

    }

    export namespace TokenOf {

      export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
      export type D = TokenInfo
      export type F = Error

      export function keyOrThrow(chainId: 1, rank: number, block: BlockNumber) {
        const body = {
          method: "eth_getTokenOf",
          params: [rank, block]
        } as const

        return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
      }

      export function queryOrThrow(context: Nullable<EthereumContext<1>>, rank: Nullable<number>, block: Nullable<BlockNumber>, storage: QueryStorage) {
        if (context == null)
          return
        if (rank == null)
          return
        if (block == null)
          return

        const fetcher = async (_: K, init: RequestInit = {}) => {
          try {
            const { signal, cache } = init

            const address = await AddressOf.queryOrThrow(context, rank, block, storage)!.fetchOrThrow({ signal, cache }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow().checkOrThrow())
            const token = await Registry.queryOrThrow(context, address.get(), block, storage)!.fetchOrThrow({ signal, cache }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow().checkOrThrow())

            return new Data(token.get(), Times.min(address, token))
          } catch (e: unknown) {
            return new Fail(Catched.wrap(e))
          }
        }

        return createQuery<K, D, F>({
          key: keyOrThrow(context.chain.chainId, rank, block),
          fetcher,
          storage
        })
      }

    }

  }

  export namespace Registry {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = TokenInfo
    export type F = Error

    export function keyOrThrow(chainId: 1, address: Address, block: BlockNumber) {
      const body = {
        method: "eth_call",
        params: [{
          to: "0xE6Fe9952CacE86E376f4D15F24358198688b2479",
          data: Abi.encodeOrThrow(RegistryAbi.registry.fromOrThrow(address))
        }, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext<1>>, address: Nullable<Address>, block: Nullable<BlockNumber>, storage: QueryStorage) {
      if (context == null)
        return
      if (address == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit = {}) => {
        try {
          const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
          const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

          if (fetched.isErr())
            return fetched

          const returns = Abi.Tuple.create(Abi.Uint256, Abi.Address)
          const [a, b] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

          const chainId = Number(a)
          const address = b

          if (address.toString() === "0x0000000000000000000000000000000000000000") {
            const cooldown = Date.now() + (1000 * 60)
            const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

            const info = { type: "native", chainId } as const

            return new Data(info, { cooldown, expiration })
          } else {
            const cooldown = Date.now() + (1000 * 60)
            const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

            const info = { type: "contract", chainId, address } as const

            return new Data(info, { cooldown, expiration })
          }
        } catch (e: unknown) {
          return new Fail(Catched.wrap(e))
        }
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, address, block),
        fetcher,
        storage
      })
    }

  }

}