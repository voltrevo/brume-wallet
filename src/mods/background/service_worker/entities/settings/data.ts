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

}