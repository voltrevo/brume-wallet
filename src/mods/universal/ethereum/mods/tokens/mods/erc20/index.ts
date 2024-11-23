import { ERC20Abi, ERC20MetadataAbi } from "@/libs/abi/erc20.abi";
import { ZeroHexBigInt } from "@/libs/bigints/bigints";
import { tokenByAddress } from "@/libs/ethereum/mods/chain";
import { Records } from "@/libs/records";
import { EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data";
import { EthereumContext } from "@/mods/universal/ethereum/mods/context";
import { Abi, Address, ZeroHexString } from "@hazae41/cubane";
import { createQuery, Data, Fail, JsonRequest, QueryStorage } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { Catched } from "@hazae41/result";
import { BlockNumber } from "../../../blocks";

export namespace ERC20 {

  export namespace BalanceOf {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = ZeroHexBigInt.From
    export type F = Error

    export function keyOrThrow(chainId: number, contract: Address, account: Address, block: BlockNumber) {
      const body = {
        method: "eth_call",
        params: [{
          to: contract,
          data: Abi.encodeOrThrow(ERC20Abi.balanceOf.fromOrThrow(account))
        }, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, contract: Nullable<Address>, account: Nullable<Address>, block: Nullable<BlockNumber>, storage: QueryStorage) {
      if (context == null)
        return
      if (contract == null)
        return
      if (account == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
        const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

        if (fetched.isErr())
          return fetched

        try {
          const returns = Abi.Uint256
          const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

          const cooldown = Date.now() + (1000 * 60)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(new ZeroHexBigInt(decoded), { cooldown, expiration })
        } catch (e: unknown) {
          return new Fail(Catched.wrap(e))
        }
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, contract, account, block),
        fetcher,
        storage
      })

    }

  }
}

export namespace ERC20Metadata {

  export namespace Name {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = string
    export type F = Error

    export function keyOrThrow(chainId: number, contract: Address, block: BlockNumber) {
      const body = {
        method: "eth_call",
        params: [{
          to: contract,
          data: Abi.encodeOrThrow(ERC20MetadataAbi.name.fromOrThrow())
        }, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, contract: Nullable<Address>, block: Nullable<BlockNumber>, storage: QueryStorage) {
      if (context == null)
        return
      if (contract == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const builtin = Records.getOrNull(tokenByAddress, contract)

        if (builtin != null) {
          const { name } = builtin

          const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 365)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(name, { cooldown, expiration })
        }

        const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
        const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

        if (fetched.isErr())
          return fetched

        try {
          const returns = Abi.String
          const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

          const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 365)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(decoded, { cooldown, expiration })
        } catch (e: unknown) {
          return new Fail(Catched.wrap(e))
        }
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, contract, block),
        fetcher,
        storage
      })

    }

  }

  export namespace Symbol {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = string
    export type F = Error

    export function keyOrThrow(chainId: number, contract: Address, block: BlockNumber) {
      const body = {
        method: "eth_call",
        params: [{
          to: contract,
          data: Abi.encodeOrThrow(ERC20MetadataAbi.symbol.fromOrThrow())
        }, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, contract: Nullable<Address>, block: Nullable<BlockNumber>, storage: QueryStorage) {
      if (context == null)
        return
      if (contract == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const builtin = Records.getOrNull(tokenByAddress, contract)

        if (builtin != null) {
          const { symbol } = builtin

          const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 365)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(symbol, { cooldown, expiration })
        }

        const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
        const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

        if (fetched.isErr())
          return fetched

        try {
          const returns = Abi.String
          const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

          const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 365)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(decoded, { cooldown, expiration })
        } catch (e: unknown) {
          return new Fail(Catched.wrap(e))
        }
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, contract, block),
        fetcher,
        storage
      })

    }

  }

  export namespace Decimals {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = number
    export type F = Error

    export function keyOrThrow(chainId: number, contract: Address, block: BlockNumber) {
      const body = {
        method: "eth_call",
        params: [{
          to: contract,
          data: Abi.encodeOrThrow(ERC20MetadataAbi.decimals.fromOrThrow())
        }, block]
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, contract: Nullable<Address>, block: Nullable<BlockNumber>, storage: QueryStorage) {
      if (context == null)
        return
      if (contract == null)
        return
      if (block == null)
        return

      const fetcher = async (request: K, init: RequestInit) => {
        const builtin = Records.getOrNull(tokenByAddress, contract)

        if (builtin != null) {
          const { decimals } = builtin

          const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 365)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(decimals, { cooldown, expiration })
        }

        const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
        const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

        if (fetched.isErr())
          return fetched

        try {
          const returns = Abi.Uint8
          const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

          const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 365)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(Number(decoded), { cooldown, expiration })
        } catch (e: unknown) {
          return new Fail(Catched.wrap(e))
        }
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, contract, block),
        fetcher,
        storage
      })

    }

  }

}