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

  export function schema(origin: string, storage: IDBStorage) {
    return createQuerySchema<string, OriginData, never>({ key: `origins/v1/${origin}`, storage })
  }

}