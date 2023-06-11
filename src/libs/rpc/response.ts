import { RpcErr, RpcErrInit } from "./err"
import { RpcOk, RpcOkInit } from "./ok"

export type RpcResponseInit<T = unknown> =
  | RpcOkInit<T>
  | RpcErrInit

export type RpcResponse<T = unknown> =
  | RpcOk<T>
  | RpcErr

export namespace RpcResponse {

  export function from<T>(init: RpcResponseInit<T>) {
    if ("error" in init)
      return RpcErr.from(init)
    return RpcOk.from(init)
  }

}