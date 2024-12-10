import { createQuery, EmptyRequest, QueryStorage } from "@hazae41/glacier";

export namespace LocaleQuery {

  export type K = EmptyRequest
  export type D = string
  export type F = never

  export function keyOrThrow() {
    return new EmptyRequest(`app:/locale`)
  }

  export function queryOrThrow(storage: QueryStorage) {
    return createQuery<K, D, F>({ key: keyOrThrow(), storage })
  }

}