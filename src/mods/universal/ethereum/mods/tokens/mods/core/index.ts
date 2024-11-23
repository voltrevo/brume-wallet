import { ContractTokenData, ContractTokenRef } from "@/mods/background/service_worker/entities/tokens/data";
import { EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data";
import { ZeroHexString } from "@hazae41/cubane";
import { createQuery, Data, JsonRequest, QueryStorage, Times } from "@hazae41/glacier";
import { Nullable, Option } from "@hazae41/option";
import { BlockNumber } from "../../../blocks";
import { EthereumContext } from "../../../context";
import { ERC20Metadata } from "../erc20";
export namespace UserToken {

  export namespace All {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = ContractTokenRef[]
    export type F = never

    export function keyOrThrow() {
      const body = {
        method: "eth_getAllUserTokens"
      } as const

      return new JsonRequest(`app:/ethereum`, { method: "POST", body })
    }

    export function queryOrThrow(storage: QueryStorage) {
      return createQuery({ key: keyOrThrow(), storage })
    }

  }

  export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
  export type D = ContractTokenData
  export type F = never

  export function keyOrThrow(chainId: number, address: ZeroHexString, block: BlockNumber) {
    const body = {
      method: "eth_getUserToken",
      params: [address, block]
    } as const

    return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
  }

  export function queryOrThrow(context: Nullable<EthereumContext>, address: Nullable<ZeroHexString>, block: Nullable<BlockNumber>, storage: QueryStorage) {
    if (context == null)
      return
    if (address == null)
      return
    if (block == null)
      return

    const fetcher = async (_: K, init: RequestInit) => {
      const { cache, signal } = init

      const self = await queryOrThrow(context, address, block, storage)!.state

      if (self.real?.current == null)
        throw new Error("Token not found")

      const [name, symbol, decimals] = await Promise.all([
        await ERC20Metadata.Name.queryOrThrow(context, address, block, storage)!.fetchOrThrow({ cache, signal }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow().checkOrThrow()),
        await ERC20Metadata.Symbol.queryOrThrow(context, address, block, storage)!.fetchOrThrow({ cache, signal }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow().checkOrThrow()),
        await ERC20Metadata.Decimals.queryOrThrow(context, address, block, storage)!.fetchOrThrow({ cache, signal }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow().checkOrThrow())
      ])

      const data = {
        type: "contract",
        uuid: `/${context.chain.chainId}/${address}`,
        chainId: context.chain.chainId,
        address: address,
        name: name.get(),
        symbol: symbol.get(),
        decimals: decimals.get()
      } as const

      return new Data(data, Times.min(name, symbol, decimals))
    }

    return createQuery({
      key: keyOrThrow(context.chain.chainId, address, block),
      fetcher,
      storage
    })
  }

}