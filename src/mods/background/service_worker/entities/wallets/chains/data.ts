import { EthereumChainId } from "@/libs/ethereum/mods/chain";
import { IDBStorage, createQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";

export interface ChainSettings {
  readonly uuid: string
  readonly chainId: EthereumChainId
  readonly enabled: boolean
}

export namespace BgChainSettings {

  export function key(uuid: string, chainId: number) {
    return `chainSettings/${uuid}/${chainId}`
  }

  export function schema(uuid: Nullable<string>, chainId: Nullable<number>, storage: IDBStorage) {
    if (uuid == null)
      return
    if (chainId == null)
      return
    return createQuery<string, ChainSettings, never>({ key: key(uuid, chainId), storage })
  }

}