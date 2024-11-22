import { ChainData } from "@/libs/ethereum/mods/chain"
import { EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { Fetched } from "@hazae41/glacier"

export interface EthereumContext {

  readonly uuid: string
  readonly chain: ChainData

  switch(chain: ChainData): EthereumContext

  fetchOrThrow<T>(request: EthereumChainlessRpcRequestPreinit<unknown>, init?: RequestInit): Promise<Fetched<T, Error>>

}
