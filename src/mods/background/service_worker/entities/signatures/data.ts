import { Abi, ZeroHexString } from "@hazae41/cubane";
import { Data, Fail, FetcherMore, QueryStorage, createQuery } from "@hazae41/glacier";
import { Catched, Result } from "@hazae41/result";
import { BgEthereumContext } from "../../context";
import { EthereumChainfulRpcRequestPreinit } from "../wallets/data";

export namespace BgSignature {

  export type K = EthereumChainfulRpcRequestPreinit<unknown>
  export type D = readonly string[]
  export type F = Error

  export const method = "sig_getSignatures"

  export function key(hash: ZeroHexString) {
    return Result.runAndWrapSync(() => ({
      chainId: 100,
      method: "eth_call",
      params: [{
        to: "0xBB59B5Cc543746A16011BC011F4db742F918672F",
        data: Abi.encodeOrThrow(Abi.FunctionSignature.parseOrThrow("get(bytes4)").fromOrThrow(hash))
      }, "latest"]
    })).ok().inner
  }

  export function schema(hash: ZeroHexString, context: BgEthereumContext, storage: QueryStorage) {
    const maybeKey = key(hash)

    if (maybeKey == null)
      return

    const fetcher = async (request: K, more: FetcherMore) => {
      try {
        const fetched = await context.fetchOrFail<ZeroHexString>(request)

        if (fetched.isErr())
          return fetched

        const returns = Abi.Tuple.create(Abi.Vector.create(Abi.String))
        const [texts] = Abi.decodeOrThrow(returns, fetched.inner).intoOrThrow()

        return new Data(texts)
      } catch (e: unknown) {
        return new Fail(Catched.wrap(e))
      }
    }

    return createQuery<K, D, F>({
      key: maybeKey,
      fetcher,
      storage
    })
  }

}