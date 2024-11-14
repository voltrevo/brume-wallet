import { ChainData } from "@/libs/ethereum/mods/chain"
import { EthereumFetchParams } from "@/mods/background/service_worker/entities/wallets/data"
import { Fetched, FetcherMore } from "@hazae41/glacier"
import { RpcRequestPreinit } from "@hazae41/jsonrpc"

export interface EthereumContext {

  readonly uuid: string
  readonly chain: ChainData

  switch(chain: ChainData): EthereumContext

  fetchOrFail<T>(init: RpcRequestPreinit<unknown> & EthereumFetchParams, more?: FetcherMore): Promise<Fetched<T, Error>>

}
