import { ChainData } from "@/libs/ethereum/mods/chain"
import { ZeroHexString } from "@hazae41/cubane"
import { FetcherMore, IDBStorage, createQuery } from "@hazae41/glacier"
import { BgEthereumContext } from "../../context"
import { EthereumQueryKey } from "../wallets/data"

export type Transaction =
  | TransactionRef
  | TransactionData

export interface TransactionRef {
  readonly ref: true
  readonly uuid: string
}

export namespace TransactionRef {

  export function create(uuid: string): TransactionRef {
    return { ref: true, uuid }
  }

  export function from(tx: Transaction): TransactionRef {
    return create(tx.uuid)
  }

}

export type TransactionTrial =
  | TransactionTrialRef
  | TransactionTrialData

export type TransactionTrialData =
  | DraftTransactionTrialData
  | FinalTransactionTrialData

export interface TransactionTrialRef {
  readonly ref: true
  readonly uuid: string
}

export namespace TransactionTrialRef {

  export function create(uuid: string): TransactionTrialRef {
    return { ref: true, uuid }
  }

  export function from(tx: TransactionTrial): TransactionTrialRef {
    return create(tx.uuid)
  }

}

export interface DraftTransactionTrialData {
  readonly type: "draft"
  readonly uuid: string

  /**
   * The nonce of all tried transactions
   */
  readonly nonce: number

  /**
   * All tried transactions
   */
  readonly transactions: readonly TransactionRef[]
}

export interface FinalTransactionTrialData {
  readonly type: "final"
  readonly uuid: string

  /**
   * The nonce of all tried transactions
   */
  readonly nonce: number

  /**
   * All tried transactions
   */
  readonly transactions: readonly TransactionRef[]

  /**
   * The transaction that was executed
   */
  readonly transaction: TransactionRef
}

export type TransactionData =
  | SignedTransactionData
  | PendingTransactionData
  | ExecutedTransactionData

export interface SignedTransactionData {
  readonly type: "signed"

  readonly uuid: string

  readonly trial: TransactionTrialRef

  readonly hash: ZeroHexString
  readonly data: ZeroHexString
}

export interface PendingTransactionData {
  readonly type: "pending"

  readonly uuid: string

  readonly trial: TransactionTrialRef

  readonly hash: ZeroHexString
  readonly data: ZeroHexString
}

export interface ExecutedTransactionData {
  readonly type: "executed"

  readonly uuid: string

  readonly trial: TransactionTrialRef

  readonly hash: ZeroHexString
  readonly data: ZeroHexString

  readonly receipt: TransactionReceiptData
}

export namespace BgTransaction {

  export type Key = string
  export type Data = TransactionData
  export type Fail = never

  export function key(uuid: string) {
    return `transaction/v0/${uuid}`
  }

  export function schema(uuid: string, storage: IDBStorage) {
    return createQuery<Key, Data, Fail>({
      key: key(uuid),
      storage
    })
  }

}

export namespace BgTransactionTrial {

  export type Key = string
  export type Data = TransactionTrialData
  export type Fail = never

  export function key(uuid: string) {
    return `transactionTrial/v0/${uuid}`
  }

  export function schema(uuid: string, storage: IDBStorage) {
    return createQuery<Key, Data, Fail>({
      key: key(uuid),
      storage
    })
  }

}

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