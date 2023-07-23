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

      const previousSessionData = previous.real?.data
      const currentSessionData = current.real?.data

      const requestsQuery = await AppRequests.schema().make(core)

      await requestsQuery.mutate(Mutators.mapData((d = new Data([])) => {
        if (previousSessionData != null)
          d = d.mapSync(p => p.filter(x => x.id !== previousSessionData.inner.id))
        if (currentSessionData != null)
          d = d.mapSync(p => [...p, AppRequestRef.from(currentSessionData.inner)])
        return d
      }))
    }

    return createQuerySchema<Key, AppRequestData, never>({ key: key(id), indexer })
  }

}