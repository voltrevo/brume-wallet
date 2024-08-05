import { createQuery, Storage } from "@hazae41/glacier"

export namespace LinksQuery {

  export type K = string
  export type D = string[]
  export type F = never

  export const key = `links`

  export function create(storage: Storage) {
    return createQuery<K, D, F>({ key, storage })
  }

}