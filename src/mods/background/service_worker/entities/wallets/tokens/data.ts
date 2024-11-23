import { Mutators } from "@/libs/glacier/mutators";
import { Token, TokenRef } from "@/mods/universal/ethereum/mods/tokens/mods/core";
import { Data, QueryStorage, States, createQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { Wallet, WalletRef } from "../data";

export type TokenSettings =
  | TokenSettingsRef
  | TokenSettingsData

export interface TokenSettingsRef {
  readonly ref: true
  readonly uuid: string
  readonly wallet: WalletRef
  readonly token: TokenRef
}

export namespace TokenSettingsRef {

  export function from(settings: TokenSettings): TokenSettingsRef {
    const { uuid, wallet, token } = settings
    return { ref: true, uuid, wallet, token }
  }

}

export interface TokenSettingsData {
  readonly uuid: string
  readonly wallet: WalletRef
  readonly token: TokenRef
  readonly enabled: boolean
}

export namespace BgTokenSettings {

  export namespace ByWallet {

    export type K = string
    export type D = TokenSettings[]
    export type F = never

    export function key(wallet: Wallet) {
      return `tokenSettingsByWallet/${wallet.uuid}`
    }

    export function schema(wallet: Nullable<Wallet>, storage: QueryStorage) {
      if (wallet == null)
        return
      return createQuery<K, D, F>({ key: key(wallet), storage })
    }

  }

  export type K = string
  export type D = TokenSettingsData
  export type F = never

  export function key(wallet: Wallet, token: Token) {
    if (token.type === "native")
      return `tokenSettings/${wallet.uuid}/${token.chainId}/native`
    if (token.type === "contract")
      return `tokenSettings/${wallet.uuid}/${token.chainId}/${token.address}`
    return token satisfies never
  }

  export function schema(wallet: Nullable<Wallet>, token: Nullable<Token>, storage: QueryStorage) {
    if (wallet == null)
      return
    if (token == null)
      return

    const indexer = async (states: States<D, F>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.getOrNull()
      const currentData = current.real?.current.ok()?.getOrNull()

      if (previousData?.uuid === currentData?.uuid)
        return

      if (previousData != null) {
        await ByWallet.schema(previousData.wallet, storage)?.mutateOrThrow(Mutators.mapData((d = new Data([])) => {
          return d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
        }))
      }

      if (currentData != null) {
        await ByWallet.schema(currentData.wallet, storage)?.mutateOrThrow(Mutators.mapData((d = new Data([])) => {
          return d.mapSync(p => [...p, TokenSettingsRef.from(currentData)])
        }))
      }
    }

    return createQuery<K, D, F>({
      key: key(wallet, token),
      storage,
      indexer
    })
  }

}