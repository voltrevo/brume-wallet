import { Mutators } from "@/libs/glacier/mutators"
import { Token } from "@/mods/background/service_worker/entities/tokens/data"
import { Wallet } from "@/mods/background/service_worker/entities/wallets/data"
import { BgTokenSettings, TokenSettingsRef } from "@/mods/background/service_worker/entities/wallets/tokens/data"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { Data, States, createQuery, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"

export namespace FgTokenSettings {

  export namespace ByWallet {

    export type Key = BgTokenSettings.ByWallet.Key
    export type Data = BgTokenSettings.ByWallet.Data
    export type Fail = BgTokenSettings.ByWallet.Fail

    export const key = BgTokenSettings.ByWallet.key

    export function schema(wallet: Nullable<Wallet>, storage: UserStorage) {
      if (wallet == null)
        return

      return createQuery<Key, Data, Fail>({ key: key(wallet), storage })
    }

  }

  export type Key = BgTokenSettings.Key
  export type Data = BgTokenSettings.Data
  export type Fail = BgTokenSettings.Fail

  export const key = BgTokenSettings.key

  export function schema(wallet: Nullable<Wallet>, token: Nullable<Token>, storage: UserStorage) {
    if (wallet == null)
      return
    if (token == null)
      return

    const indexer = async (states: States<Data, Fail>) => {
      const { current, previous } = states

      const previousData = previous?.real?.data?.get()
      const currentData = current.real?.data?.get()

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

    return createQuery<Key, Data, Fail>({ key: key(wallet, token), storage, indexer })
  }

}

export function useTokenSettings(wallet: Nullable<Wallet>, token: Nullable<Token>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgTokenSettings.schema, [wallet, token, storage])
  useSubscribe(query, storage)
  return query
}

export function useTokenSettingsByWallet(wallet: Nullable<Wallet>) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgTokenSettings.ByWallet.schema, [wallet, storage])
  useSubscribe(query, storage)
  return query
}