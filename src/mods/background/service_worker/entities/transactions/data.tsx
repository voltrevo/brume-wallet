import { ChainData } from "@/libs/ethereum/mods/chain"
import { ZeroHexString } from "@hazae41/cubane"
import { FetcherMore, IDBStorage, createQuery } from "@hazae41/glacier"
import { BgEthereumContext } from "../../context"
import { EthereumQueryKey } from "../wallets/data"

export interface TransactionReceiptData {
  readonly blockHash: ZeroHexString
  readonly blockNumber: ZeroHexString
  readonly contractAddress: ZeroHexString
  readonly cumulativeGasUsed: ZeroHexString
  readonly effectiveGasPrice: ZeroHexString
  readonly from: ZeroHexString
  readonly gasUsed: ZeroHexString
  readonly logs: readonly LogData[]
  readonly logsBloom: ZeroHexString
  readonly status: ZeroHexString
  readonly to: ZeroHexString
  readonly transactionHash: ZeroHexString
  readonly transactionIndex: ZeroHexString
  readonly type: ZeroHexString
}

export interface LogData {
  readonly address: ZeroHexString
  readonly blockHash: ZeroHexString
  readonly blockNumber: ZeroHexString
  readonly data: ZeroHexString
  readonly logIndex: ZeroHexString
  readonly removed: boolean
  readonly topics: readonly ZeroHexString[]
  readonly transactionHash: ZeroHexString
  readonly transactionIndex: ZeroHexString
}

export namespace BgTransactionReceipt {

  export type Key = EthereumQueryKey<unknown>
  export type Data = TransactionReceiptData
  export type Fail = Error

  export function key(hash: ZeroHexString, chain: ChainData) {
    return {
      chainId: chain.chainId,
      method: "eth_getTransactionReceipt",
      params: [hash],
      noCheck: true
    }
  }

  export function schema(hash: ZeroHexString, ethereum: BgEthereumContext, storage: IDBStorage) {
    const fetcher = async (request: EthereumQueryKey<unknown>, more: FetcherMore) =>
      await BgEthereumContext.fetchOrFail<Data>(ethereum, request, more)

    return createQuery<Key, Data, Fail>({
      key: key(hash, ethereum.chain),
      fetcher,
      storage
    })
  }

}