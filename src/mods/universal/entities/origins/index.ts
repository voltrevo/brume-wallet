import { createQuery, QueryStorage } from "@hazae41/glacier"
import { Nullable } from "@hazae41/option"
import { Blobby } from "../blobbys"

export type Origin =
  | OriginData
  | OriginRef

export interface OriginRef {
  readonly ref: true
  readonly origin: string
}

export interface PreOriginData {
  readonly origin: string,
  readonly title?: string
  readonly icon?: string
  readonly description?: string
}

export interface OriginData {
  readonly origin: string,
  readonly title?: string
  readonly icons?: Blobby[]
  readonly description?: string
}

export namespace OriginQuery {

  export type K = string
  export type D = OriginData
  export type F = never

  export function key(origin: string) {
    return `origins/${origin}`
  }

  export function route(cacheKey: string, storage: QueryStorage) {
    if (!cacheKey.startsWith("origins/"))
      return
    const [origin] = cacheKey.split("/").slice(1)

    return create(origin, storage)
  }

  export function create(origin: Nullable<string>, storage: QueryStorage) {
    if (origin == null)
      return

    return createQuery<K, D, F>({ key: key(origin), storage })
  }

}