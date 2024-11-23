import { ZeroHexBigInt } from "@/libs/bigints/bigints";
import { EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data";
import { EthereumContext } from "@/mods/universal/ethereum/mods/context";
import { ZeroHexString } from "@hazae41/cubane";
import { createQuery, JsonRequest, QueryStorage } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";

export type BlockNumber =
  | ZeroHexString
  | "latest"
  | "earliest"
  | "pending"
  | "safe"
  | "finalized"

export namespace GetBlock {

  export namespace ByNumber {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = ZeroHexBigInt.From
    export type F = Error

    export function keyOrThrow(chainId: number, number: BlockNumber) {
      const body = {
        method: "eth_getBlockByNumber",
        params: [number, false],
      } as const

      return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
    }

    export function queryOrThrow(context: Nullable<EthereumContext>, number: Nullable<BlockNumber>, storage: QueryStorage) {
      if (context == null)
        return
      if (number == null)
        return

      const fetcher = async (request: K, init: RequestInit = {}) => {
        const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
        const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

        if (fetched.isErr())
          return fetched

        const cooldown = Date.now() + (1000 * 60)
        const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

        return fetched.setInit({ cooldown, expiration })
      }

      return createQuery<K, D, F>({
        key: keyOrThrow(context.chain.chainId, number),
        fetcher,
        storage
      })
    }

  }

}