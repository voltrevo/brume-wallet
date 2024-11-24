import { tokenByAddress } from "@/libs/ethereum/mods/chain";
import { Records } from "@/libs/records";
import { EthereumChainlessRpcRequestPreinit, Wallet } from "@/mods/background/service_worker/entities/wallets/data";
import { Address } from "@hazae41/cubane";
import { createQuery, Data, Fail, JsonRequest, QueryStorage, Times } from "@hazae41/glacier";
import { Nullable, Option } from "@hazae41/option";
import { Catched } from "@hazae41/result";
import { BlockNumber } from "../../../blocks";
import { EthereumContext } from "../../../context";
import { ERC20Metadata } from "../erc20";

export type Token =
  | TokenData
  | TokenRef

export type NativeToken =
  | NativeTokenData
  | NativeTokenRef

export type ContractToken =
  | ContractTokenData
  | ContractTokenRef

export type TokenRef =
  | NativeTokenRef
  | ContractTokenRef

export namespace TokenRef {

  export function from(token: TokenData) {
    if (token.type === "native")
      return NativeTokenRef.from(token)
    if (token.type === "contract")
      return ContractTokenRef.from(token)
    return token satisfies never
  }

}

export interface NativeTokenRef {
  readonly ref: true
  readonly uuid: string
  readonly type: "native"
  readonly chainId: number
}

export namespace NativeTokenRef {
  export function from(token: NativeTokenData): NativeTokenRef {
    const { uuid, type, chainId } = token
    return { ref: true, uuid, type, chainId }
  }
}

export interface ContractTokenRef {
  readonly ref: true
  readonly uuid: string
  readonly type: "contract"
  readonly chainId: number
  readonly address: Address
}

export namespace ContractTokenRef {
  export function from(token: ContractTokenData): ContractTokenRef {
    const { uuid, type, chainId, address } = token
    return { ref: true, uuid, type, chainId, address }
  }
}

export type TokenData =
  | NativeTokenData
  | ContractTokenData

export interface NativeTokenData {
  readonly uuid: string
  readonly type: "native"
  readonly name: string
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
}

export interface ContractTokenData {
  readonly uuid: string
  readonly type: "contract",
  readonly name: string
  readonly chainId: number,
  readonly symbol: string,
  readonly decimals: number,
  readonly address: Address
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

        if (builtin != null) {
          const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 365)
          const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

          return new Data(builtin, { cooldown, expiration })
        }

        const [name, symbol, decimals] = await Promise.all([
          ERC20Metadata.Name.queryOrThrow(context, address, block, storage)!.fetchOrThrow({ cache, signal }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow().checkOrThrow()),
          ERC20Metadata.Symbol.queryOrThrow(context, address, block, storage)!.fetchOrThrow({ cache, signal }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow().checkOrThrow()),
          ERC20Metadata.Decimals.queryOrThrow(context, address, block, storage)!.fetchOrThrow({ cache, signal }).then(r => Option.wrap(r.getAny().real?.current).getOrThrow().checkOrThrow())
        ])

        const data: ContractTokenData = {
          uuid: `/${context.chain.chainId}/${address}`,
          type: "contract",
          chainId: context.chain.chainId,
          address: address,
          name: name.get(),
          symbol: symbol.get(),
          decimals: decimals.get()
        } as const

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

export namespace UserTokens {

  export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
  export type D = TokenRef[]
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

export namespace WalletTokens {

  export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
  export type D = TokenRef[]
  export type F = never

  export function keyOrThrow(wallet: Wallet) {
    const body = {
      method: "eth_getWalletTokens",
      params: [wallet.uuid]
    } as const

    return new JsonRequest(`app:/ethereum`, { method: "POST", body })
  }

  export function queryOrThrow(wallet: Nullable<Wallet>, storage: QueryStorage) {
    if (wallet == null)
      return
    return createQuery<K, D, F>({ key: keyOrThrow(wallet), storage })
  }

}