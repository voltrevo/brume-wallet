import { ZeroHexBigInt } from "@/libs/bigints/bigints";
import { EthereumChainfulRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data";
import { EthereumContext } from "@/mods/universal/context/ethereum";
import { ZeroHexString } from "@hazae41/cubane";
import { createQuery, QueryStorage } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";

export namespace GetBalance {

  export type K = EthereumChainfulRpcRequestPreinit<unknown>
  export type D = ZeroHexBigInt.From
  export type F = Error

  export function keyOrThrow(chainId: number, address: ZeroHexString, block: string) {
    return {
      version: 2,
      chainId: chainId,
      method: "eth_getBalance",
      params: [address, block]
    }
  }

  export function queryOrThrow(context: Nullable<EthereumContext>, address: Nullable<ZeroHexString>, block: Nullable<string>, storage: QueryStorage) {
    if (context == null)
      return
    if (address == null)
      return
    if (block == null)
      return

    const fetcher = async (request: K, init: RequestInit = {}) => {
      const fetched = await context.fetchOrThrow<ZeroHexString>(request, init)

      if (fetched.isErr())
        return fetched

      const cooldown = Date.now() + (1000 * 60)
      const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

      return fetched.setInit({ cooldown, expiration })
    }

    return createQuery<K, D, F>({
      key: keyOrThrow(context.chain.chainId, address, block),
      fetcher,
      storage
    })
  }

}