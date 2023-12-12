import { IDBStorage, createQuery } from "@hazae41/glacier"
import { BlobbyRef } from "../blobbys/data"

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
  readonly icons?: BlobbyRef[]
  readonly description?: string
}

export namespace BgOrigin {

  export type Key = ReturnType<typeof key>

  export function key(origin: string) {
    return `origins/${origin}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(origin: string, storage: IDBStorage) {
    return createQuery<Key, OriginData, never>({ key: key(origin), storage })
  }

}