import { IDBStorage, createQuery } from "@hazae41/glacier"

export type Blobby =
  | BlobbyData
  | BlobbyRef

export interface BlobbyRef {
  readonly ref: true
  readonly id: string
}

export namespace BlobbyRef {

  export function create(id: string): BlobbyRef {
    return { ref: true, id }
  }

  export function from(blobby: Blobby): BlobbyRef {
    return create(blobby.id)
  }

}

export interface BlobbyData {
  readonly id: string,
  readonly data: string
}

export namespace BgBlobby {

  export type Key = ReturnType<typeof key>

  export function key(id: string) {
    return `blobby/${id}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(id: string, storage: IDBStorage) {
    return createQuery<Key, BlobbyData, never>({ key: key(id), storage })
  }

}