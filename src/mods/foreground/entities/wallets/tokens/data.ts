import { Mutators } from "@/libs/glacier/mutators"
import { Token } from "@/mods/background/service_worker/entities/tokens/data"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { BgTokenSettings, TokenSettingsData, TokenSettingsRef } from "@/mods/background/service_worker/entities/wallets/tokens/data"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { Data, States, createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"

export namespace FgTokenSettings {

  export namespace ByWallet {

    export function schema(wallet: Nullable<Wallet>, storage: UserStorage) {
      if (wallet == null)
        return
      return createQuery<string, TokenSettingsRef[], never>({ key: BgTokenSettings.ByWallet.key(wallet), storage })
    }

  }

  export function schema(wallet: Nullable<Wallet>, token: Nullable<Token>, storage: UserStorage) {
    if (wallet == null)
      return
    if (token == null)
      return

    const indexer = async (states: States<TokenSettingsData, never>) => {
      const { current, previous } = states

      const previousData = previous?.real?.data?.inner
      const currentData = current.real?.data?.inner

      if (previousData?.uuid === currentData?.uuid)
        return

      if (previousData != null) {
        await ByWallet.schema(previousData.wallet, storage)?.mutate(Mutators.mapData((d = new Data([])) => {
          return d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
        }))
      }

      if (currentData != null) {
        await ByWallet.schema(currentData.wallet, storage)?.mutate(Mutators.mapData((d = new Data([])) => {
          return d.mapSync(p => [...p, TokenSettingsRef.from(currentData)])
        }))
      }
    }

    return createQuery<string, TokenSettingsData, never>({ key: BgTokenSettings.key(wallet, token), storage, indexer })
  }

}

export function useTokenSettings(wallet: Nullable<Wallet>, token: Nullable<Token>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgTokenSettings.schema, [wallet, token, storage])
  useSubscribe(query as any, storage)
  return query
}

export function useTokenSettingsByWallet(wallet: Nullable<Wallet>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgTokenSettings.ByWallet.schema, [wallet, storage])
  useSubscribe(query as any, storage)
  return query
}