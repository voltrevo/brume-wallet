import { Mutators } from "@/libs/glacier/mutators"
import { BgToken, ContractTokenData, ContractTokenRef } from "@/mods/background/service_worker/entities/tokens/data"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { Data, States, createQuery, useQuery } from "@hazae41/glacier"

export namespace FgToken {

  export namespace Contract {

    export namespace All {

      export type Key = BgToken.Contract.All.Key
      export type Data = BgToken.Contract.All.Data
      export type Fail = BgToken.Contract.All.Fail

      export const key = BgToken.Contract.All.key

      export function schema(storage: UserStorage) {
        return createQuery<Key, Data, Fail>({ key, storage })
      }

    }

    export type Key = BgToken.Contract.Key
    export type Data = BgToken.Contract.Data
    export type Fail = BgToken.Contract.Fail

    export const key = BgToken.Contract.key

    export function schema(chainId: number, address: string, storage: UserStorage) {
      const indexer = async (states: States<ContractTokenData, never>) => {
        const { current, previous } = states

        const previousData = previous?.real?.data?.inner
        const currentData = current.real?.data?.inner

        if (previousData?.uuid === currentData?.uuid)
          return

        if (previousData != null) {
          await All.schema(storage)?.mutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
          }))
        }

        if (currentData != null) {
          await All.schema(storage)?.mutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => [...p, ContractTokenRef.from(currentData)])
          }))
        }
      }

      return createQuery<Key, Data, Fail>({
        key: key(chainId, address),
        indexer,
        storage
      })
    }

  }

}

export function useToken(chainId: number, address: string) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Contract.schema, [chainId, address, storage])
  useSubscribe(query, storage)
  return query
}

export function useTokens() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgToken.Contract.All.schema, [storage])
  useSubscribe(query, storage)
  return query
}