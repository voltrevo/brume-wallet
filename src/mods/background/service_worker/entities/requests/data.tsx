import { Mutators } from "@/libs/xswr/mutators"
import { Optional } from "@hazae41/option"
import { Data, IndexerMore, States, createQuerySchema } from "@hazae41/xswr"
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
  readonly params: Record<string, Optional<string>>
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
    const indexer = async (states: States<AppRequestData, never>, more: IndexerMore) => {
      const { current, previous = current } = states
      const { core } = more

      const previousData = previous.real?.data
      const currentData = current.real?.data

      const requestsQuery = await AppRequests.schema().make(core)

      await requestsQuery.mutate(Mutators.mapData((d = new Data([])) => {
        console.log("d", d)
        if (previousData != null)
          d = d.mapSync(p => p.filter(x => x.id !== previousData.inner.id))
        if (currentData != null)
          d = d.mapSync(p => [...p, AppRequestRef.from(currentData.inner)])
        console.log("d2", d)
        return d
      }))
    }

    return createQuerySchema<Key, AppRequestData, never>({ key: key(id), indexer })
  }

}