import { RpcError } from "@/libs/rpc"
import { createQuery } from "@hazae41/glacier"

export interface StatusData {
  readonly id: string
  readonly error?: RpcError
}

export namespace Status {

  export type Key = ReturnType<typeof key>

  export function key(id: string) {
    return `session/status/v4/${id}`
  }

  export type Schema = ReturnType<typeof schema>

  export function schema(id: string) {
    return createQuery<Key, StatusData, never>({ key: key(id) })
  }

}