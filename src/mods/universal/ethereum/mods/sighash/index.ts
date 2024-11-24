import { EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data";
import { Abi, ZeroHexString } from "@hazae41/cubane";
import { Data, Fail, JsonRequest, QueryStorage, createQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { Catched } from "@hazae41/result";
import { EthereumContext } from "../context";

export namespace Sighash {

  export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
  export type D = readonly string[]
  export type F = Error

  export function keyOrThrow(chainId: 100, hash: ZeroHexString) {
    const body = {
      method: "eth_call",
      params: [{
        to: "0xBB59B5Cc543746A16011BC011F4db742F918672F",
        data: Abi.encodeOrThrow(Abi.FunctionSignature.parseOrThrow("get(bytes4)").fromOrThrow(hash))
      }, "latest"]
    } as const

    return new JsonRequest(`app:/ethereum/${chainId}`, { method: "POST", body })
  }

  export function queryOrThrow(context: Nullable<EthereumContext<100>>, hash: Nullable<ZeroHexString>, storage: QueryStorage) {
    if (context == null)
      return
    if (hash == null)
      return

    const fetcher = async (request: K, init: RequestInit) => {
      try {
        const body = await JsonRequest.from(request).then(r => r.bodyAsJson)
        const fetched = await context.fetchOrThrow<ZeroHexString>(body, init)

        if (fetched.isErr())
          return fetched

        const returns = Abi.Tuple.create(Abi.Vector.create(Abi.String))
        const [texts] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

        const cooldown = Date.now() + (1000 * 60 * 60 * 24 * 30)
        const expiration = Date.now() + (1000 * 60 * 60 * 24 * 365)

        return new Data(texts, { cooldown, expiration })
      } catch (e: unknown) {
        return new Fail(Catched.wrap(e))
      }
    }

    return createQuery<K, D, F>({
      key: keyOrThrow(context.chain.chainId, hash),
      fetcher,
      storage
    })
  }

}