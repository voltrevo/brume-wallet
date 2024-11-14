import { ChainData } from "@/libs/ethereum/mods/chain"
import { ZeroHexString } from "@hazae41/cubane"
import { Data, FetcherMore, QueryStorage, States, createQuery } from "@hazae41/glacier"
import { None, Nullable, Some } from "@hazae41/option"
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
  readonly nonce: ZeroHexString

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
  readonly nonce: ZeroHexString

  /**
   * All tried transactions
   */
  readonly transactions: readonly TransactionRef[]

  /**
   * The transaction that was executed
   */
  readonly transaction: TransactionRef
}

export type TransactionParametersData =
  | LegacyTransactionParametersData
  | Eip1559TransactionParametersData

export interface LegacyTransactionParametersData {
  readonly from: ZeroHexString
  readonly to?: Nullable<ZeroHexString>
  readonly value: ZeroHexString
  readonly gas: ZeroHexString
  readonly gasPrice: ZeroHexString
  readonly nonce: ZeroHexString
  readonly data?: ZeroHexString
}

export interface Eip1559TransactionParametersData {
  readonly from: ZeroHexString
  readonly to?: Nullable<ZeroHexString>
  readonly value: ZeroHexString
  readonly maxFeePerGas: ZeroHexString
  readonly maxPriorityFeePerGas: ZeroHexString
  readonly gas: ZeroHexString
  readonly nonce: ZeroHexString
  readonly data?: ZeroHexString
}

export type TransactionData =
  | SignedTransactionData
  | PendingTransactionData
  | ExecutedTransactionData

export interface SignedTransactionData {
  readonly type: "signed"

  readonly uuid: string

  readonly trial: TransactionTrialRef

  readonly chainId: number

  readonly hash: ZeroHexString
  readonly data: ZeroHexString

  readonly params: TransactionParametersData
}

export interface PendingTransactionData {
  readonly type: "pending"

  readonly uuid: string

  readonly trial: TransactionTrialRef

  readonly chainId: number

  readonly hash: ZeroHexString
  readonly data: ZeroHexString

  readonly params: TransactionParametersData
}

export interface ExecutedTransactionData {
  readonly type: "executed"

  readonly uuid: string

  readonly trial: TransactionTrialRef

  readonly chainId: number

  readonly hash: ZeroHexString
  readonly data: ZeroHexString

  readonly params: TransactionParametersData
  readonly receipt: TransactionReceiptData
}

export namespace BgTransaction {

  export namespace All {

    export namespace ByAddress {

      export type K = string
      export type D = TransactionRef[]
      export type F = never

      export function key(address: ZeroHexString) {
        return `transaction/v0/all/byAddress/${address}`
      }

      export function schema(address: ZeroHexString, storage: QueryStorage) {
        return createQuery<K, D, F>({
          key: key(address),
          storage
        })
      }

    }

  }

  export type K = string
  export type D = TransactionData
  export type F = never

  export function key(uuid: string) {
    return `transaction/v0/${uuid}`
  }

  export function schema(uuid: string, storage: QueryStorage) {
    const indexer = async (states: States<D, F>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.getOrNull()
      const currentData = current.real?.current.ok()?.getOrNull()

      if (previousData?.uuid !== currentData?.uuid) {
        if (previousData != null) {
          await BgTransactionTrial.schema(previousData.trial.uuid, storage)?.mutate(s => {
            const current = s.real?.current

            if (current == null)
              return new None()
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(d => ({ ...d, transactions: d.transactions.filter(t => t.uuid !== uuid) })))
          })

          await All.ByAddress.schema(previousData.params.from, storage)?.mutate(s => {
            const current = s.real?.current

            if (current == null)
              return new None()
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(d => d.filter(t => t.uuid !== uuid)))
          })
        }

        if (currentData != null) {
          await BgTransactionTrial.schema(currentData.trial.uuid, storage).mutate(s => {
            const current = s.real?.current

            if (current == null) {
              const uuid = currentData.trial.uuid
              const nonce = currentData.params.nonce
              const transactions = [TransactionRef.from(currentData)]

              const inner = { type: "draft", uuid, nonce, transactions } as const

              return new Some(new Data(inner))
            }

            if (current.isErr())
              return new None()

            return new Some(current.mapSync(d => ({ ...d, transactions: [...d.transactions, TransactionRef.from(currentData)] })))
          })

          await All.ByAddress.schema(currentData.params.from, storage)?.mutate(s => {
            const current = s.real?.current

            if (current == null)
              return new Some(new Data([TransactionRef.from(currentData)]))
            if (current.isErr())
              return new None()

            return new Some(current.mapSync(d => [...d, TransactionRef.from(currentData)]))
          })
        }
      }

      if (currentData?.type === "executed") {
        await BgTransactionTrial.schema(currentData.trial.uuid, storage).mutate(s => {
          const current = s.real?.current

          if (current == null)
            return new None()
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(d => ({ ...d, transaction: TransactionRef.from(currentData) })))
        })
      }
    }

    return createQuery<K, D, F>({
      key: key(uuid),
      storage,
      indexer
    })
  }

}

export namespace BgTransactionTrial {

  export namespace All {

    export namespace ByAddress {

      export type K = string
      export type D = TransactionTrialRef[]
      export type F = never

      export function key(address: ZeroHexString) {
        return `transactionTrial/v0/all/byAddress/${address}`
      }

      export function schema(address: ZeroHexString, storage: QueryStorage) {
        return createQuery<K, D, F>({
          key: key(address),
          storage
        })
      }

    }

  }

  export type K = string
  export type D = TransactionTrialData
  export type F = never

  export function key(uuid: string) {
    return `transactionTrial/v0/${uuid}`
  }

  export function schema(uuid: string, storage: QueryStorage) {
    return createQuery<K, D, F>({
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

  export type K = EthereumQueryKey<unknown>
  export type D = Nullable<TransactionReceiptData>
  export type F = Error

  export function key(hash: ZeroHexString, chain: ChainData) {
    return {
      chainId: chain.chainId,
      method: "eth_getTransactionReceipt",
      params: [hash],
      noCheck: true
    }
  }

  export function schema(uuid: string, hash: ZeroHexString, context: BgEthereumContext, storage: QueryStorage) {
    const fetcher = async (request: EthereumQueryKey<unknown>, more: FetcherMore) =>
      await context.fetchOrFail<D>(request, more)

    const indexer = async (states: States<D, F>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.getOrNull()
      const currentData = current.real?.current.ok()?.getOrNull()

      if (previousData == null && currentData != null) {
        await BgTransaction.schema(uuid, storage)?.mutate(s => {
          const current = s.real?.current

          if (current == null)
            return new None()
          if (current.isErr())
            return new None()

          return new Some(current.mapSync(d => ({ ...d, type: "executed", receipt: currentData }) as const))
        })
      }
    }

    return createQuery<K, D, F>({
      key: key(hash, context.chain),
      fetcher,
      indexer,
      storage
    })
  }

}