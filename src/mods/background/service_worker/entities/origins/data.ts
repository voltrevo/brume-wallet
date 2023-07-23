import { IDBStorage, createQuerySchema } from "@hazae41/xswr"

export type Origin =
  | OriginData
  | OriginRef

export interface OriginRef {
  readonly ref: true
  readonly origin: string
}

export interface OriginData {
  readonly origin: string,
  readonly title?: string
  readonly icon?: string
  readonly description?: string
}

export namespace Origin {

  export type Key = ReturnType<typeof key>

  export function key(origin: string) {
    return `origins/${origin}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(origin: string, storage: IDBStorage) {
    return createQuerySchema<Key, OriginData, never>({ key: key(origin), storage })
  }

}