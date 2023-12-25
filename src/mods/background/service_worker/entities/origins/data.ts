import { IDBStorage, createQuery } from "@hazae41/glacier"
import { Blobby } from "../blobbys/data"

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

export namespace BgOrigin {

  export type Key = string
  export type Data = OriginData
  export type Fail = never

  export function key(origin: string) {
    return `origins/${origin}`
  }

  export function schema(origin: string, storage: IDBStorage) {
    return createQuery<Key, Data, Fail>({ key: key(origin), storage })
  }

}