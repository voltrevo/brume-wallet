import { tokenByAddress } from "@/libs/ethereum/mods/chain";
import { Records } from "@/libs/records";
import { ContractTokenData, ContractTokenRef } from "@/mods/background/service_worker/entities/tokens/data";
import { EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data";
import { Address } from "@hazae41/cubane";
import { createQuery, Data, Fail, JsonRequest, QueryStorage, Times } from "@hazae41/glacier";
import { Nullable, Option } from "@hazae41/option";
import { Catched } from "@hazae41/result";
import { BlockNumber } from "../../../blocks";
import { EthereumContext } from "../../../context";
import { ERC20Metadata } from "../erc20";

export namespace UserTokens {

  export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
  export type D = ContractTokenRef[]
  export type F = never

  export function keyOrThrow() {
    const body = {
      method: "eth_getUserTokens"
    } as const

    return new JsonRequest(`app:/ethereum`, { method: "POST", body })
  }

  export function queryOrThrow(storage: QueryStorage) {
    return createQuery<K, D, F>({ key: keyOrThrow(), storage })
  }

}

export namespace Token {

  export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
  export type D = ContractTokenData
  export type F = Error

  export function keyOrThrow(chainId: number, address: Address, block: BlockNumber) {
    const body = {
      method: "eth_getToken",
      params: [address, block]
    } as const

    return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
  }

  export function queryOrThrow(context: Nullable<EthereumContext>, address: Nullable<Address>, block: Nullable<BlockNumber>, storage: QueryStorage) {
    if (context == null)
      return
    if (address == null)
      return
    if (block == null)
      return

    const fetcher = async (_: K, init: RequestInit) => {
      try {
        const { cache, signal } = init

        const builtin = Records.getOrNull(tokenByAddress, address)

        console.log("!!! builtin", builtin)

        if (builtin != null) {
          const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 365)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(builtin, { cooldown, expiration })
        }

        const [name, symbol, decimals] = await Promise.all([
          await ERC20Metadata.Name.queryOrThrow(context, address, block, storage)!.fetchOrThrow({ cache, signal }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow().checkOrThrow()),
          await ERC20Metadata.Symbol.queryOrThrow(context, address, block, storage)!.fetchOrThrow({ cache, signal }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow().checkOrThrow()),
          await ERC20Metadata.Decimals.queryOrThrow(context, address, block, storage)!.fetchOrThrow({ cache, signal }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow().checkOrThrow())
        ])

        const data: ContractTokenData = {
          type: "contract",
          uuid: `/${context.chain.chainId}/${address}`,
          chainId: context.chain.chainId,
          address: address,
          name: name.get(),
          symbol: symbol.get(),
          decimals: decimals.get()
        } as const

        console.log("!!! data", data)

        return new Data(data, Times.min(name, symbol, decimals))
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