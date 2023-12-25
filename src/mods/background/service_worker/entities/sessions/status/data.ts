import { createQuery } from "@hazae41/glacier"
import { RpcError } from "@hazae41/jsonrpc"

export interface StatusData {
  readonly id: string
  readonly error?: RpcError
}

export namespace Status {

  export type Key = string
  export type Data = StatusData
  export type Fail = never

  export function key(id: string) {
    return `session/status/v4/${id}`
  }

  export function schema(id: string) {
    return createQuery<Key, Data, Fail>({ key: key(id) })
  }

}