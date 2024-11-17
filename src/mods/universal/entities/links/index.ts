import { createQuery, QueryStorage } from "@hazae41/glacier"

export namespace LinksQuery {

  export type K = string
  export type D = string[]
  export type F = never

  export const key = `links`

  export function route(cacheKey: string, storage: QueryStorage) {
    if (cacheKey !== key)
      return
    return create(storage)
  }

  export function create(storage: QueryStorage) {
    return createQuery<K, D, F>({ key, storage })
  }

}