import { ChainData, ChainId } from "@/libs/ethereum/mods/chain"
import { EthereumChainlessRpcRequestPreinit } from "@/mods/background/service_worker/entities/wallets/data"
import { Fetched } from "@hazae41/glacier"

export interface EthereumContext<Id extends ChainId = ChainId> {

  readonly uuid: string
  readonly chain: ChainData<Id>

  switch<Id extends ChainId = ChainId>(chain: ChainData<Id>): EthereumContext<Id>

  fetchOrThrow<T>(request: EthereumChainlessRpcRequestPreinit<unknown>, init?: RequestInit): Promise<Fetched<T, Error>>

}
