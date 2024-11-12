import { createQuery } from "@hazae41/glacier"
import { RpcError } from "@hazae41/jsonrpc"

export interface StatusData {
  readonly id: string
  readonly error?: RpcError
}

export namespace Status {

  export type K = string
  export type D = StatusData
  export type F = never

  export function key(id: string) {
    return `session/status/v4/${id}`
  }

  export function schema(id: string) {
    return createQuery<K, D, F>({ key: key(id) })
  }

}