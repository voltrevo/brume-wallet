import { ChainData } from "@/libs/ethereum/mods/chain"
import { EthereumChainlessQueryKey } from "@/mods/background/service_worker/entities/wallets/data"
import { Fetched, FetcherMore } from "@hazae41/glacier"

export interface EthereumContext {

  readonly uuid: string
  readonly chain: ChainData

  switch(chain: ChainData): EthereumContext

  fetchOrFail<T>(init: EthereumChainlessQueryKey<unknown>, more?: FetcherMore): Promise<Fetched<T, Error>>

}
