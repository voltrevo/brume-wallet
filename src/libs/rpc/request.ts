export type RpcId = number | string

export type RpcRequestPreinit<T = unknown> =
  | RpcParamlessRequestPreinit
  | RpcParamfulRequestPreinit<T>

export interface RpcParamfulRequestPreinit<T = unknown> {
  readonly method: string,
  readonly params: NonNullable<T>
}

export interface RpcParamlessRequestPreinit {
  readonly method: string
  readonly params?: undefined
}

export type RpcRequestInit<T = unknown> =
  | RpcParamlessRequestInit
  | RpcParamfulRequestInit<T>

export interface RpcParamfulRequestInit<T = unknown> {
  readonly id: RpcId
  readonly method: string
  readonly params: NonNullable<T>
}

export interface RpcParamlessRequestInit {
  readonly id: RpcId
  readonly method: string
  readonly params?: undefined
}

export namespace RpcRequestInit {

  export function clone<P, T extends RpcRequestInit<P>>(init: T): T {
    const { id, method, params } = init
    return { id, method, params } as T
  }

}

export class RpcRequest<T> {
  readonly jsonrpc = "2.0" as const

  constructor(
    readonly id: RpcId,
    readonly method: string,
    readonly params?: T
  ) { }

  static from<T>(init: RpcRequestInit<T>) {
    const { id, method, params } = init
    return new RpcRequest(id, method, params)
  }
}