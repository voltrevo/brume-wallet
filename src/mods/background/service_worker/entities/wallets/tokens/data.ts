import { Mutators } from "@/libs/xswr/mutators";
import { Data, IDBStorage, States, createQuery } from "@hazae41/glacier";
import { Nullable } from "@hazae41/option";
import { Ok, Panic, Result } from "@hazae41/result";
import { Token, TokenRef } from "../../tokens/data";
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

    export function key(wallet: Wallet) {
      return `tokenSettingsByWallet/${wallet.uuid}`
    }

    export function schema(wallet: Nullable<Wallet>, storage: IDBStorage) {
      if (wallet == null)
        return
      return createQuery<string, TokenSettingsRef[], never>({ key: key(wallet), storage })
    }

  }

  export function key(wallet: Wallet, token: Token) {
    if (token.type === "native")
      return `tokenSettings/${wallet.uuid}/${token.chainId}/native`
    if (token.type === "contract")
      return `tokenSettings/${wallet.uuid}/${token.chainId}/${token.address}`
    throw new Panic()
  }

  export function schema(wallet: Nullable<Wallet>, token: Nullable<Token>, storage: IDBStorage) {
    if (wallet == null)
      return
    if (token == null)
      return

    const indexer = async (states: States<TokenSettingsData, never>) => {
      return await Result.unthrow<Result<void, Error>>(async t => {
        const { current, previous } = states

        const previousData = previous?.real?.data?.inner
        const currentData = current.real?.data?.inner

        console.log(previousData, currentData)

        if (previousData?.uuid === currentData?.uuid)
          return Ok.void()

        if (previousData != null)
          await ByWallet.schema(previousData.wallet, storage)?.tryMutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
          })).then(r => r.throw(t))

        if (currentData != null)
          await ByWallet.schema(currentData.wallet, storage)?.tryMutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => [...p, TokenSettingsRef.from(currentData)])
          })).then(r => r.throw(t))

        return Ok.void()
      })
    }

    return createQuery<string, TokenSettingsData, never>({ key: key(wallet, token), storage, indexer })
  }

}