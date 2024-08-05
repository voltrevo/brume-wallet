import { Storage, createQuery } from "@hazae41/glacier";

export namespace SettingsQuery {

  export namespace Logs {

    export type K = string
    export type D = boolean
    export type F = never

    export const key = `settings/logs`

    export function create(storage: Storage) {
      return createQuery<K, D, F>({ key, storage })
    }

  }

  export namespace Chain {

    export type K = string
    export type D = number
    export type F = never

    export const key = `settings/chain`

    export function create(storage: Storage) {
      return createQuery<K, D, F>({ key, storage })
    }

  }

}