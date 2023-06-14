import { NonOptional } from "@hazae41/option"

export type RpcId = number | string

export type RpcRequestPreinit<P> =
  | RpcParamlessRequestPreinit
  | RpcParamfulRequestPreinit<P>

export interface RpcParamfulRequestPreinit<P> {
  readonly method: string,
  readonly params: NonOptional<P>
}

export interface RpcParamlessRequestPreinit {
  readonly method: string
  readonly params?: undefined
}

export type RpcRequestInit<P> =
  | RpcParamlessRequestInit
  | RpcParamfulRequestInit<P>

export interface RpcParamfulRequestInit<P> {
  readonly jsonrpc: "2.0"
  readonly id: RpcId
  readonly method: string
  readonly params: NonOptional<P>
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