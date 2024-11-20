import { Mutators } from "@/libs/glacier/mutators"
import { BgToken, ContractTokenRef } from "@/mods/background/service_worker/entities/tokens/data"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { createQuery, Data, States, useQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"

export namespace FgToken {

  export namespace Contract {

    export namespace All {

      export type K = BgToken.Contract.All.K
      export type D = BgToken.Contract.All.D
      export type F = BgToken.Contract.All.F

      export const key = BgToken.Contract.All.key

      export function schema(storage: UserStorage) {
        return createQuery<K, D, F>({ key, storage })
      }

    }

    export type K = BgToken.Contract.K
    export type D = BgToken.Contract.D
    export type F = BgToken.Contract.F

    export const key = BgToken.Contract.key

    export function schema(chainId: Nullable<number>, address: Nullable<string>, storage: UserStorage) {
      if (chainId == null)
        return
      if (address == null)
        return

      const indexer = async (states: States<D, F>) => {
        const { current, previous } = states

        const previousData = previous?.real?.current.ok()?.getOrNull()
        const currentData = current.real?.current.ok()?.getOrNull()

        if (previousData?.uuid === currentData?.uuid)
          return

        if (previousData != null) {
          await All.schema(storage)?.mutateOrThrow(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
          }))
        }

        if (currentData != null) {
          await All.schema(storage)?.mutateOrThrow(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => [...p, ContractTokenRef.from(currentData)])
          }))
        }
      }

      return createQuery<K, D, F>({
        key: key(chainId, address),
        indexer,
        storage
      })
    }

  }

}

export function useToken(chainId: Nullable<number>, address: Nullable<string>) {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgToken.Contract.schema, [chainId, address, storage])

  return query
}

export function useTokens() {
  const storage = useUserStorageContext().getOrThrow()
  const query = useQuery(FgToken.Contract.All.schema, [storage])

  return query
}
