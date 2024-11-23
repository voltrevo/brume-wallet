import { Mutators } from "@/libs/glacier/mutators"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { BgTokenSettings, TokenSettingsRef } from "@/mods/background/service_worker/entities/wallets/tokens/data"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { Token } from "@/mods/universal/ethereum/mods/tokens/mods/core"
import { Data, States, createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"

export namespace FgTokenSettings {

  export namespace ByWallet {

    export type K = BgTokenSettings.ByWallet.K
    export type D = BgTokenSettings.ByWallet.D
    export type F = BgTokenSettings.ByWallet.F

    export const key = BgTokenSettings.ByWallet.key

    export function schema(wallet: Nullable<Wallet>, storage: UserStorage) {
      if (wallet == null)
        return

      return createQuery<K, D, F>({ key: key(wallet), storage })
    }

  }

  export type K = BgTokenSettings.K
  export type D = BgTokenSettings.D
  export type F = BgTokenSettings.F

  export const key = BgTokenSettings.key

  export function schema(wallet: Nullable<Wallet>, token: Nullable<Token>, storage: UserStorage) {
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

    return createQuery<K, D, F>({ key: key(wallet, token), storage, indexer })
  }

}

export function useTokenSettings(wallet: Nullable<Wallet>, token: Nullable<Token>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgTokenSettings.schema, [wallet, token, storage])

  return query
}

export function useTokenSettingsByWallet(wallet: Nullable<Wallet>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgTokenSettings.ByWallet.schema, [wallet, storage])

  return query
}