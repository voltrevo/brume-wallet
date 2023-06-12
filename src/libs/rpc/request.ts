export type RpcRequestPreinit<P = unknown> =
  | RpcRequestPreinitParamful<P>
  | RpcRequestPreinitParamless

export interface RpcRequestPreinitParamless {
  readonly method: string
  readonly params?: undefined
}

export interface RpcRequestPreinitParamful<P = unknown> {
  readonly method: string,
  readonly params: P
}

export type RpcRequestInit<P = unknown> =
  | RpcRequestInitParamful<P>
  | RpcRequestInitParamless

export interface RpcRequestInitParamful<P = unknown> {
  readonly jsonrpc: "2.0"
  readonly id: number
  readonly method: string
  readonly params: P
}

export interface RpcRequestInitParamless {
  readonly jsonrpc: "2.0"
  readonly id: number
  readonly method: string
  readonly params?: undefined
}