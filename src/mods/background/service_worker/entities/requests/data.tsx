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

    export type K = string
    export type D = AppRequest[]
    export type F = never

    export const key = `requests`

    export function schema() {
      return createQuery<K, D, F>({ key })
    }

  }

  export type K = string
  export type D = AppRequestData
  export type F = never

  export function key(id: string) {
    return `request/${id}`
  }

  export function schema(id: string) {
    const indexer = async (states: States<D, F>) => {
      const { current, previous } = states

      const previousData = previous?.real?.current.ok()?.getOrNull()
      const currentData = current.real?.current.ok()?.getOrNull()

      await BgAppRequest.All.schema().mutate(Mutators.mapData((d = new Data([])) => {
        if (previousData?.id === currentData?.id)
          return d
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.id !== previousData.id))
        if (currentData != null)
          d = d.mapSync(p => [...p, AppRequestRef.from(currentData)])
        return d
      }))
    }

    return createQuery<K, D, F>({ key: key(id), indexer })
  }

}