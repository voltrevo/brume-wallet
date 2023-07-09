import { EthereumChain } from "@/libs/ethereum/chain"
import { IDBStorage, createQuerySchema } from "@hazae41/xswr"
import { Wallet } from "../wallets/data"

export interface EthereumSession {
  origin: string
  wallet: Wallet
  chain: EthereumChain
}

export function getEthereumSession(origin: string, storage: IDBStorage) {
  return createQuerySchema<string, EthereumSession, never>({ key: `sessions/${origin}`, storage })
}