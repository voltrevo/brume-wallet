export type RpcId = number | string | null

export type RpcRequestPreinit<T = unknown> =
  undefined extends T
  ? RpcParamlessRequestPreinit<T>
  : RpcParamfulRequestPreinit<T>

export interface RpcParamfulRequestPreinit<T = unknown> {
  readonly method: string,
  readonly params: NonNullable<T>
}

export interface RpcParamlessRequestPreinit<T = unknown> {
  readonly method: string
  readonly params?: T
}

export type RpcRequestInit<T = unknown> =
  undefined extends T
  ? RpcParamlessRequestInit<T>
  : RpcParamfulRequestInit<T>

export interface RpcParamfulRequestInit<T = unknown> {
  readonly id: RpcId
  readonly method: string
  readonly params: NonNullable<T>
}

export interface RpcParamlessRequestInit<T = unknown> {
  readonly id: RpcId
  readonly method: string
  readonly params?: T
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

  toJSON() {
    const { jsonrpc, id, method, params } = this
    return JSON.stringify({ jsonrpc, id, method, params })
  }

}