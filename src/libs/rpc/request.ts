import { Optional } from "@hazae41/option"

export interface RpcRequestPreinit<P extends Optional<unknown[]> = Optional<unknown[]>> {
  readonly method: string,
  readonly params: P
}

export interface RpcRequestInit<P extends Optional<unknown[]> = Optional<unknown[]>> {
  readonly jsonrpc: "2.0"
  readonly id: number
  readonly method: string
  readonly params: P
}