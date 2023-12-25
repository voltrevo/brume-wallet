import { Mutators } from "@/libs/glacier/mutators"
import { Data, States, createQuery } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"

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

export namespace BgAppRequest {

  export namespace All {

    export type Key = string
    export type Data = AppRequest[]
    export type Fail = never

    export const key = `requests`

    export function schema() {
      return createQuery<Key, Data, Fail>({ key })
    }

  }

  export type Key = string
  export type Data = AppRequestData
  export type Fail = never

  export function key(id: string) {
    return `request/${id}`
  }

  export function schema(id: string) {
    const indexer = async (states: States<AppRequestData, never>) => {
      const { current, previous = current } = states

      const previousData = previous.real?.data
      const currentData = current.real?.data

      await BgAppRequest.All.schema().mutate(Mutators.mapData((d = new Data([])) => {
        if (previousData?.inner.id === currentData?.inner.id)
          return d
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.id !== previousData.inner.id))
        if (currentData != null)
          d = d.mapSync(p => [...p, AppRequestRef.from(currentData.inner)])
        return d
      }))
    }

    return createQuery<Key, Data, Fail>({ key: key(id), indexer })
  }

}