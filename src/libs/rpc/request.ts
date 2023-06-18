import { NonOptional } from "@hazae41/option"

export type RpcId = number | string

export type RpcRequestPreinit<T = unknown> =
  | RpcParamlessRequestPreinit
  | RpcParamfulRequestPreinit<T>

export interface RpcParamfulRequestPreinit<T = unknown> {
  readonly method: string,
  readonly params: NonOptional<T>
}

export interface RpcParamlessRequestPreinit {
  readonly method: string
  readonly params?: undefined
}

export type RpcRequestInit<T = unknown> =
  | RpcParamlessRequestInit
  | RpcParamfulRequestInit<T>

export interface RpcParamfulRequestInit<T = unknown> {
  readonly jsonrpc: "2.0"
  readonly id: RpcId
  readonly method: string
  readonly params: NonOptional<T>
}

export interface RpcParamlessRequestInit {
  readonly jsonrpc: "2.0"
  readonly id: RpcId
  readonly method: string
  readonly params?: undefined
}

export namespace RpcRequestInit {

  export function clone<P, T extends RpcRequestInit<P>>(init: T): T {
    const { id, jsonrpc, method, params } = init
    return { id, jsonrpc, method, params } as T
  }

}