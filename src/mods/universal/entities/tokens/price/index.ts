import { SimpleContractTokenData, SimplePairDataV3 } from "@/libs/ethereum/mods/chain"
import { Records } from "@/libs/records"
import { EthereumChainfulRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { EthereumContext } from "@/mods/universal/context/ethereum"
import { Fixed } from "@hazae41/cubane"
import { createQuery, Data, Fetched, FetcherMore, QueryStorage } from "@hazae41/glacier"
import { Nullable, Option } from "@hazae41/option"
import { FactoryV3, PairV3 } from "../../pairs/v3"

export namespace PriceV3 {

  export type K = EthereumChainfulRpcRequestPreinit<unknown>
  export type D = Fixed.From
  export type F = Error

  export function keyOrThrow(chainId: number, token: SimpleContractTokenData, block: string) {
    return {
      chainId: chainId,
      method: "eth_get",
      params: [{
        to: token.address,
        data: "price/v3/3000"
      }, block]
    }
  }

  export function queryOrThrow(context: Nullable<EthereumContext>, token: Nullable<SimpleContractTokenData>, block: Nullable<string>, storage: QueryStorage) {
    if (context == null)
      return
    if (token == null)
      return
    if (block == null)
      return

    const fetcher = (request: K, more: FetcherMore) => Fetched.runOrDoubleWrap(async () => {
      const weth = Records.getOrThrow(FactoryV3.wethByChainId, context.chain.chainId)
      const pair = await FactoryV3.GetPool.queryOrThrow(context, token, weth, 3000, block, storage)!.refetch().then(r => Option.wrap(r.real?.current).getOrThrow())

      if (pair.isErr())
        return pair

      const pairData: SimplePairDataV3 = { version: 3, address: pair.get(), chainId: context.chain.chainId, token0: token, token1: weth, reversed: false }
      const price = await PairV3.Price.queryOrThrow(context, pairData, block, storage)!.refetch().then(r => Option.wrap(r.real?.current).getOrThrow())

      if (price.isErr())
        return price

      return new Data(price.get(), pair)
    })

    return createQuery<K, D, F>({
      key: keyOrThrow(context.chain.chainId, token, block),
      fetcher,
      storage
    })
  }

}