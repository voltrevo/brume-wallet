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

export type BlockData =
  | BlockData1
  | BlockData2

export type FullBlockData =
  | FullBlockData1
  | FullBlockData2

export interface BlockData1 {
  readonly difficulty: ZeroHexString
  readonly extraData: ZeroHexString
  readonly gasLimit: ZeroHexString
  readonly gasUsed: ZeroHexString
  readonly hash: ZeroHexString
  readonly logsBloom: ZeroHexString
  readonly miner: ZeroHexString
  readonly mixHash: ZeroHexString
  readonly nonce: ZeroHexString
  readonly number: ZeroHexString
  readonly parentHash: ZeroHexString
  readonly receiptsRoot: ZeroHexString
  readonly sha3Uncles: ZeroHexString
  readonly size: ZeroHexString
  readonly stateRoot: ZeroHexString
  readonly timestamp: ZeroHexString
  readonly totalDifficulty: ZeroHexString
  readonly transactions: ZeroHexString[]
  readonly transactionsRoot: ZeroHexString
  readonly uncles: []
}

export interface FullBlockData1 {
  readonly difficulty: ZeroHexString
  readonly extraData: ZeroHexString
  readonly gasLimit: ZeroHexString
  readonly gasUsed: ZeroHexString
  readonly hash: ZeroHexString
  readonly logsBloom: ZeroHexString
  readonly miner: ZeroHexString
  readonly mixHash: ZeroHexString
  readonly nonce: ZeroHexString
  readonly number: ZeroHexString
  readonly parentHash: ZeroHexString
  readonly receiptsRoot: ZeroHexString
  readonly sha3Uncles: ZeroHexString
  readonly size: ZeroHexString
  readonly stateRoot: ZeroHexString
  readonly timestamp: ZeroHexString
  readonly totalDifficulty: ZeroHexString
  readonly transactions: TransactionData1[]
  readonly transactionsRoot: ZeroHexString
  readonly uncles: []
}

export interface TransactionData1 {
  readonly blockHash: ZeroHexString
  readonly blockNumber: ZeroHexString
  readonly from: ZeroHexString
  readonly gas: ZeroHexString
  readonly gasPrice: ZeroHexString
  readonly hash: ZeroHexString
  readonly input: ZeroHexString
  readonly nonce: ZeroHexString
  readonly r: ZeroHexString
  readonly s: ZeroHexString
  readonly to: ZeroHexString
  readonly transactionIndex: ZeroHexString
  readonly type: ZeroHexString
  readonly v: ZeroHexString
  readonly value: ZeroHexString
}

export interface BlockData2 {
  readonly baseFeePerGas: ZeroHexString
  readonly blobGasUsed: ZeroHexString
  readonly difficulty: ZeroHexString
  readonly excessBlobGas: ZeroHexString
  readonly extraData: ZeroHexString
  readonly gasLimit: ZeroHexString
  readonly gasUsed: ZeroHexString
  readonly hash: ZeroHexString
  readonly logsBloom: ZeroHexString
  readonly miner: ZeroHexString
  readonly mixHash: ZeroHexString
  readonly nonce: ZeroHexString
  readonly number: ZeroHexString
  readonly parentHash: ZeroHexString
  readonly receiptsRoot: ZeroHexString
  readonly sha3Uncles: ZeroHexString
  readonly size: ZeroHexString
  readonly stateRoot: ZeroHexString
  readonly timestamp: ZeroHexString
  readonly totalDifficulty: ZeroHexString
  readonly transactions: ZeroHexString[]
  readonly transactionsRoot: ZeroHexString
  readonly uncles: []
}

export interface FullBlockData2 {
  readonly baseFeePerGas?: ZeroHexString
  readonly blobGasUsed: ZeroHexString
  readonly difficulty: ZeroHexString
  readonly excessBlobGas: ZeroHexString
  readonly extraData: ZeroHexString
  readonly gasLimit: ZeroHexString
  readonly gasUsed: ZeroHexString
  readonly hash: ZeroHexString
  readonly logsBloom: ZeroHexString
  readonly miner: ZeroHexString
  readonly mixHash: ZeroHexString
  readonly nonce: ZeroHexString
  readonly number: ZeroHexString
  readonly parentHash: ZeroHexString
  readonly receiptsRoot: ZeroHexString
  readonly sha3Uncles: ZeroHexString
  readonly size: ZeroHexString
  readonly stateRoot: ZeroHexString
  readonly timestamp: ZeroHexString
  readonly totalDifficulty: ZeroHexString
  readonly transactions: TransactionData2[]
  readonly transactionsRoot: ZeroHexString
  readonly uncles: []
}

export interface TransactionData2 {
  readonly accessList: ZeroHexString[]
  readonly blockHash: ZeroHexString
  readonly blockNumber: ZeroHexString
  readonly chainId: ZeroHexString
  readonly from: ZeroHexString
  readonly gas: ZeroHexString
  readonly gasPrice: ZeroHexString
  readonly hash: ZeroHexString
  readonly input: ZeroHexString
  readonly maxFeePerGas: ZeroHexString
  readonly maxPriorityFeePerGas: ZeroHexString
  readonly nonce: ZeroHexString
  readonly r: ZeroHexString
  readonly s: ZeroHexString
  readonly to: ZeroHexString
  readonly transactionIndex: ZeroHexString
  readonly type: ZeroHexString
  readonly v: ZeroHexString
  readonly value: ZeroHexString
  readonly yParity: ZeroHexString
}

export namespace GetBlock {

  export namespace ByNumber {

    export type K = JsonRequest.From<EthereumChainlessRpcRequestPreinit<unknown>>
    export type D = BlockData
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
        const fetched = await context.fetchOrThrow<BlockData>(body, init)

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