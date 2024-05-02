import { IDBStorage, createQuery } from "@hazae41/glacier";

export namespace BgSettings {

  export namespace Logs {

    export type Key = string
    export type Data = boolean
    export type Fail = never

    export const key = `settings/logs`

    export function schema(storage: IDBStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

  export namespace Chain {

    export type Key = string
    export type Data = number
    export type Fail = never

    export const key = `settings/chain`

    export function schema(storage: IDBStorage) {
      return createQuery<Key, Data, Fail>({ key, storage })
    }

  }

}