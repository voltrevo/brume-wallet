import { ERC20Abi, ERC20MetadataAbi } from "@/libs/abi/erc20.abi";
import { EthereumChainfulRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data";
import { Abi, Fixed, ZeroHexString } from "@hazae41/cubane";
import { createQuery, Data, Fetched, QueryStorage } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { EthereumContext } from "../../context/ethereum";

export namespace ERC20 {

  export namespace BalanceOf {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = Fixed.From<0>
    export type F = Error

    export function keyOrThrow(chainId: number, contract: string, address: string, block: string) {
      return {
        chainId,
        method: "eth_call",
        params: [{
          to: contract,
          data: Abi.encodeOrThrow(ERC20Abi.balanceOf.fromOrThrow(address))
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, contract: Nullable<string>, address: Nullable<string>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (contract == null)
        return
      if (address == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, init: RequestInit) => Fetched.runOrDoubleWrap(async () => {
        const fetched = await context.fetchOrFail<ZeroHexString>(request, init)

        if (fetched.isErr())
          return fetched

        const returns = Abi.Uint256
        const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

        return new Data(new Fixed(decoded, 0))
      })

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, contract, address, block),
        fetcher,
        storage
      })

    }

  }
}

export namespace ERC20Metadata {

  export namespace Name {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = string
    export type F = Error

    export function keyOrThrow(chainId: number, address: string, block: string) {
      return {
        chainId,
        method: "eth_call",
        params: [{
          to: address,
          data: Abi.encodeOrThrow(ERC20MetadataAbi.name.fromOrThrow())
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, address: Nullable<string>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (address == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, init: RequestInit) => Fetched.runOrDoubleWrap(async () => {
        const fetched = await context.fetchOrFail<ZeroHexString>(request, init)

        if (fetched.isErr())
          return fetched

        const returns = Abi.String
        const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

        return new Data(decoded)
      })

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, address, block),
        fetcher,
        storage
      })

    }

  }

  export namespace Symbol {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = string
    export type F = Error

    export function keyOrThrow(chainId: number, address: string, block: string) {
      return {
        chainId,
        method: "eth_call",
        params: [{
          to: address,
          data: Abi.encodeOrThrow(ERC20MetadataAbi.symbol.fromOrThrow())
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, address: Nullable<string>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (address == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, init: RequestInit) => Fetched.runOrDoubleWrap(async () => {
        const fetched = await context.fetchOrFail<ZeroHexString>(request, init)

        if (fetched.isErr())
          return fetched

        const returns = Abi.String
        const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

        return new Data(decoded)
      })

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, address, block),
        fetcher,
        storage
      })

    }

  }

  export namespace Decimals {

    export type K = EthereumChainfulRpcRequestPreinit<unknown>
    export type D = number
    export type F = Error

    export function keyOrThrow(chainId: number, address: string, block: string) {
      return {
        chainId,
        method: "eth_call",
        params: [{
          to: address,
          data: Abi.encodeOrThrow(ERC20MetadataAbi.decimals.fromOrThrow())
        }, block]
      }
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, address: Nullable<string>, block: Nullable<string>, storage: QueryStorage) {
      if (context == null)
        return
      if (address == null)
        return
      if (block == null)
        return

      const fetcher = (request: K, init: RequestInit) => Fetched.runOrDoubleWrap(async () => {
        const fetched = await context.fetchOrFail<ZeroHexString>(request, init)

        if (fetched.isErr())
          return fetched

        const returns = Abi.Uint8
        const decoded = Abi.decodeOrThrow(returns, fetched.get()).intoOrThrow()

        return new Data(Number(decoded))
      })

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, address, block),
        fetcher,
        storage
      })

    }

  }

}