import { IDBStorage, createQuery } from "@hazae41/glacier";

export namespace BgSettings {

  export namespace Logs {

    export const key = `settings/logs`

    export function schema(storage: IDBStorage) {
      return createQuery<string, boolean, never>({ key, storage })
    }

  }

}