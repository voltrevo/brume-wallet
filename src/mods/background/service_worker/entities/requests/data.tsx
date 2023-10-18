import { Mutators } from "@/libs/xswr/mutators"
import { Data, States, createQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { Ok, Result } from "@hazae41/result"
import { AppRequests } from "./all/data"

export type AppRequest =
  | AppRequestRef
  | AppRequestData

export interface AppRequestRef {
  readonly ref: true
  readonly id: string
}

export namespace AppRequestRef {

  export function from(request: AppRequest): AppRequestRef {
    return { ref: true, id: request.id }
  }

}

export interface AppRequestData {
  readonly id: string
  readonly method: string
  readonly params: Record<string, Nullable<string>>
  readonly origin: string
  readonly session?: string
}

export namespace AppRequest {

  export type Key = ReturnType<typeof key>

  export function key(id: string) {
    return `request/${id}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(id: string) {
    const indexer = async (states: States<AppRequestData, never>) => {
      return await Result.unthrow<Result<void, Error>>(async t => {
        const { current, previous = current } = states

        const previousData = previous.real?.data
        const currentData = current.real?.data

        await AppRequests.schema().tryMutate(Mutators.mapData((d = new Data([])) => {
          if (previousData?.inner.id === currentData?.inner.id)
            return d
          if (previousData != null)
            d = d.mapSync(p => p.filter(x => x.id !== previousData.inner.id))
          if (currentData != null)
            d = d.mapSync(p => [...p, AppRequestRef.from(currentData.inner)])
          return d
        })).then(r => r.throw(t))

        return Ok.void()
      })
    }

    return createQuery<Key, AppRequestData, never>({ key: key(id), indexer })
  }

}