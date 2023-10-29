import { Mutators } from "@/libs/xswr/mutators"
import { BgContractToken, ContractTokenData, ContractTokenRef } from "@/mods/background/service_worker/entities/tokens/data"
import { useSubscribe } from "@/mods/foreground/storage/storage"
import { UserStorage, useUserStorageContext } from "@/mods/foreground/storage/user"
import { Data, States, createQuery, useQuery } from "@hazae41/glacier"
import { Ok, Result } from "@hazae41/result"

export namespace FgContractToken {

  export namespace All {

    export function schema(storage: UserStorage) {
      return createQuery<string, ContractTokenRef[], never>({ key: BgContractToken.All.key, storage })
    }

  }

  export function schema(chainId: number, address: string, storage: UserStorage) {
    const indexer = async (states: States<ContractTokenData, never>) => {
      return await Result.unthrow<Result<void, Error>>(async t => {
        const { current, previous } = states

        const previousData = previous?.real?.data?.inner
        const currentData = current.real?.data?.inner

        if (previousData?.uuid === currentData?.uuid)
          return Ok.void()

        if (previousData != null)
          await All.schema(storage)?.tryMutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => p.filter(x => x.uuid !== previousData.uuid))
          })).then(r => r.throw(t))

        if (currentData != null)
          await All.schema(storage)?.tryMutate(Mutators.mapData((d = new Data([])) => {
            return d.mapSync(p => [...p, ContractTokenRef.from(currentData)])
          })).then(r => r.throw(t))

        return Ok.void()
      })
    }

    return createQuery<string, ContractTokenData, never>({ key: BgContractToken.key(chainId, address), indexer, storage })
  }

}

export function useToken(chainId: number, address: string) {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgContractToken.schema, [chainId, address, storage])
  useSubscribe(query as any, storage)
  return query
}

export function useTokens() {
  const storage = useUserStorageContext().unwrap()
  const query = useQuery(FgContractToken.All.schema, [storage])
  useSubscribe(query as any, storage)
  return query
}